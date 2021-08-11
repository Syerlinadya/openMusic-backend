const routes = (handler) => [
    {
        method: "POST",
        path: "/playlists",
        handler: handler.postPlaylistsHandler,
        options: {
            auth: "openmusic_jwt",
        },
    },
    {
        method: "GET",
        path: "/playlists",
        handler: handler.getPlaylistsHandler,
        options: {
            auth: "openmusic_jwt",
        },
    },
    {
        method: 'DELETE',
        path: '/playlists/{playlistId}',
        handler: handler.deletePlaylistByIdHandler,
        options: {
          auth: 'openmusic_jwt',
        },
    },
    {
        method: 'POST',
        path: '/playlists/{playlistId}/songs',
        handler: handler.postPlaylistSongHandler,
        options: {
          auth: 'openmusic_jwt',
        },
    },
    {
        method: 'GET',
        path: '/playlists/{playlistId}/songs',
        handler: handler.getPlaylistSongHandler,
        options: {
          auth: 'openmusic_jwt',
        },
    },
    {
        method: 'DELETE',
        path: '/playlists/{playlistId}/songs',
        handler: handler.deletePlaylistSongHandler,
        options: {
          auth: 'openmusic_jwt',
        },
    },
];
  
module.exports = routes;