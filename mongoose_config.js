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
    apartmentCode: { type: Number, required: true, unique: true },
    apartmentName: { type: String, required: true, unique: true },
    keys: Number,
    lastCleaningStatus: StatusChangeSchema
})
ApartmentSchema.plugin(mongoosePaginate);

const StatusChangeSchema = new Schema({
    cleaningStatus: { type: String, required: true, enum: ['OCCUPIED', 'READY_TO_CLEAN', 'ON_CLEANING', 'CLEAN'] },
    changeStatusDate: { type: Date, required: true },
})

const BookingSchema = new Schema({
    bookingCode: { type: String, required: true },
    apartment: { type: Schema.Types.ObjectId, ref: 'Apartment' },
    expectedKeys: Number,
    returnedKeys: Number,
    checkInDate: { type: Date, required: true },
    specifiedCheckInTime: Boolean,
    checkOutDate: { type: Date, required: true },
    specifiedCheckOutTime: Boolean,
    cleaningStatusChangeLog: [StatusChangeSchema],
    timeCleaned: Date,
    message: String,
})
BookingSchema.index({ apartment: 1, bookingCode: 1 }, { unique: true })

BookingSchema.plugin(mongoosePaginate);

const User = mongoose.model('User', UserSchema)
const Apartment = mongoose.model('Apartment', ApartmentSchema)
const StatusChange = mongoose.model('StatusChange', StatusChangeSchema)
const Booking = mongoose.model('Booking', BookingSchema)

const models = { User, Apartment, StatusChange, Booking }

module.exports = models;