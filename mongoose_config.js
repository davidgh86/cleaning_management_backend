const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2');

mongoose.connect('mongodb://user:pwd@localhost:27017/cleaning');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: { type: String, required: true, unique: true, index: true},
    password: { type: String, required: true, select: false },
    role: { type: String, required: true },
    email: { type: String, required: true, unique: true},
});
UserSchema.plugin(mongoosePaginate);

const ApartmentSchema = new Schema({
    apartmentName: { type: String, required: true, unique: true },
    keys: Number
})
ApartmentSchema.plugin(mongoosePaginate);

const StatusChangeSchema = new Schema({
    cleaningStatus: { type: String, required: true },
    changeStatusDate: { type: Date, required: true },
})

const ArrivalSchema = new Schema({
    apartment: { type: Schema.Types.ObjectId, ref: 'Apartment' },
    expectedKeys: Number,
    returnedKeys: Number,
    checkInDate: { type: Date, required: true },
    checkInTimeNull: Boolean,
    checkOutDate: { type: Date, required: true },
    checkOutTimeNull: Boolean,
    cleaningStatus: [StatusChangeSchema],
    timeCleaned: Date,
    message: String,
})
ArrivalSchema.index({ apartmentCode: 1, arrivalDate: 1 }, { unique: true })
ArrivalSchema.plugin(mongoosePaginate);

const User = mongoose.model('User', UserSchema)
const Apartment = mongoose.model('Apartment', ApartmentSchema)
const StatusChange = mongoose.model('StatusChange', StatusChangeSchema)
const Arrival = mongoose.model('Arrival', ArrivalSchema)

const models = { User, Apartment, StatusChange, Arrival }

module.exports = models;