const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const { mapDBToModel } = require('../../utils');

class PlaylistService {
    constructor(collaborationService, cacheService){
        this._pool = new Pool();
        this._collaborationService = collaborationService;
        this._cacheService = cacheService;
    }

    async addPlaylist({ name, owner }) {
        const id = `playlist-${nanoid(16)}`;
        const insertedAt = new Date().toISOString();

        const query = {
            text: ' INSERT INTO playlists VALUES($1, $2, $3, $4, $5) RETURNING id',
            values: [id, name, insertedAt, insertedAt, owner]
        };

        const result = await this._pool.query(query);

        if(!result.rows[0].id){
            throw new InvariantError('Playlist gagal ditambahkan');
        }

        return result.rows[0].id;
    }

    async getPlaylists(owner) {
        const query = {
            text: `SELECT playlists.id, playlists.name, users.username FROM playlists 
            LEFT JOIN users ON users.id = playlists.owner
            LEFT JOIN collaborations ON playlists.id = collaborations.playlist_id  
            WHERE playlists.owner = $1 OR collaborations.user_id = $1
            GROUP BY playlists.id, users.username`,
            values: [owner],
        };
    
        const result = await this._pool.query(query);
        return result.rows.map(mapDBToModel);
    }

    async deletePlaylistById(id) {
        const query = {
            text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
            values: [id],
        };
    
        const result = await this._pool.query(query);
    
        if (!result.rows.length) {
            throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
        }
    }

    async verifyPlaylistOwner(playlistId, owner) {
        const query = {
            text: 'SELECT * FROM playlists WHERE id = $1',
            values: [playlistId],
        };

        const result = await this._pool.query(query);

        if (!result.rows.length) {
            throw new NotFoundError('Playlist tidak ditemukan');
        }

        const playlist = result.rows[0];
        
        if (playlist.owner !== owner) {
            throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
        }
    }

    //playlist song
    async addSongPlaylist(playlistId, songId){
        const id = `${nanoid(16)}`;
        const insertedAt = new Date().toISOString();

        const query = {
            text: 'INSERT INTO playlistsongs VALUES($1, $2, $3, $4, $5) RETURNING id',
            values: [id, playlistId, songId, insertedAt, insertedAt],
        }

        const result = await this._pool.query(query);
        if(!result.rows[0].id){
            throw new InvariantError("Lagu gagal ditambahkan ke playlist");
        }

        await this._cacheService.delete(`songs:${playlistId}`);
        return result.rows[0].id;
    }

    async verifyNewSongPlaylists(songId, playlistId){
        const query = {
            text: "SELECT song_id FROM playlistsongs WHERE song_id = $1 AND playlist_id = $2",
            values: [songId, playlistId],
        };
        const result = await this._pool.query(query);

        if(result.rowCount > 0){
            throw new InvariantError(
                "Gagal menambahkan lagu. Lagu ini sudah ditambahkan di playlists"
            );
        }
    }

    async getPlaylistSong(playlistId){
        try{
            // mendapatkan lagu dari cache
            const result = await this._cacheService.get(`songs:${playlistId}`);
            return JSON.parse(result);
        }catch{
            const query = {
                text: `SELECT songs.id, songs.title, songs.performer
                FROM songs JOIN playlistsongs 
                ON songs.id = playlistsongs.song_id 
                WHERE playlistsongs.playlist_id = $1`,
                values: [playlistId],
            }
    
            const result = await this._pool.query(query);

            await this._cacheService.set(`songs:${playlistId}`, JSON.stringify(result.rows));

            return result.rows;
        }
        
    }

    async deletePlaylistSong(playlistId, songId){
        const query = {
            text: 'DELETE FROM playlistsongs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
            values: [playlistId, songId],
        };
    
        const result = await this._pool.query(query);
    
        if (!result.rows.length) {
            throw new InvariantError('Lagu gagal dihapus');
        }

        await this._cacheService.delete(`songs:${playlistId}`);
    }

    async verifyPlaylistSongAccess(playlistId, userId){
        try {
            await this.verifyPlaylistOwner(playlistId, userId);
        } catch (error){
            if(error instanceof NotFoundError){
                throw error;
            }
            try {
                await this._collaborationService.verifyCollaborator(playlistId, userId);
            } catch {
                throw error;
            }
        }
    }
}

module.exports = PlaylistService;