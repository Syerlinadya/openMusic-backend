const InvariantError = require('../../exceptions/InvariantError');
const { ImageHeadersSchema, ImageheadersSchema } = require('./schema');

const UploadValidator = {
    validateImageHeaders: (headers) => {
        const validationResult = ImageheadersSchema.validate(headers);

        if(validationResult.error){
            throw new InvariantError(validationResult.error.message);
        }
    },
};

module.exports = UploadValidator;