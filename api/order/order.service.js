import mongodb from 'mongodb'
const { ObjectId } = mongodb

import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { utilService } from '../../services/util.service.js'

export const orderService = {
    remove,
    query,
    getById,
    add,
    update,
    addOrderMsg,
}


async function query(filterBy) {
    try {
        const criteria = buildCriteria(filterBy)
        const collection = await dbService.getCollection('order')
        const orders = await collection.find(criteria).toArray()
        return orders
    } catch (err) {
        logger.error('cannot find orders', err)
        throw err
    }
}

function buildCriteria(filterBy) {
    const criteria = {}
    const userId = filterBy.loggedUser._id
    // אם נקבל role=buyer, נחזיר רק את השתיים שהמשתמש הוא קונה (buyer)
    if (filterBy.role === 'buyer') {
        criteria['buyer._id'] = userId
        return criteria
    }
    // אם נקבל role=seller, נחזיר רק את ההזמנות שהמשתמש הוא מוכר (seller)
    if (filterBy.role === 'seller') {
        criteria['seller._id'] = userId
        return criteria
    }
    // אם לא קיבלנו role, נחזיר גם buyer וגם seller (ברירת מחדל)
    criteria.$or = [
        { 'seller._id': userId },
        { 'buyer._id': userId }
    ]
    return criteria
}

async function getById(orderId) {
    try {
        const collection = await dbService.getCollection('order')
        const order = collection.findOne({ _id: new ObjectId(orderId) })
        return order
    } catch (err) {
        logger.error(`while finding order ${orderId}`, err)
        throw err
    }
}

async function remove(orderId) {
    try {
        const collection = await dbService.getCollection('order')
        await collection.deleteOne({ _id: new ObjectId(orderId) })
    } catch (err) {
        logger.error(`cannot remove order ${orderId}`, err)
        throw err
    }
}

async function add(order) {
    try {
        const collection = await dbService.getCollection('order')
        await collection.insertOne(order)
        return order
    } catch (err) {
        logger.error('cannot insert order', err)
        throw err
    }
}

async function update(order) {
    try {
        const orderToSave = {
            buyer: order.buyer,
            createdAt: +order.createdAt,
            daysToMake: +order.daysToMake,
            gig: order.gig,
            packagePrice: +order.packagePrice,
            seller: order.seller,
            status: order.status,
            title: order.title
        }
        const collection = await dbService.getCollection('order')
        await collection.updateOne({ _id: new ObjectId(order._id) }, { $set: orderToSave })
        return order
    } catch (err) {
        logger.error(`cannot update order ${order_id}`, err)
        throw err
    }
}

async function addOrderMsg(orderId, msg) {
    try {
        msg.id = utilService.makeId()
        const collection = await dbService.getCollection('order')
        await collection.updateOne({ _id: new ObjectId(orderId) }, { $push: { msgs: msg } })
        return msg
    } catch (err) {
        logger.error(`cannot add order msg ${orderId}`, err)
        throw err
    }
}

async function removeCarMsg(carId, msgId) {
    try {
        const collection = await dbService.getCollection('car')
        await collection.updateOne({ _id: new ObjectId(carId) }, { $pull: { msgs: { id: msgId } } })
        return msgId
    } catch (err) {
        logger.error(`cannot add car msg ${carId}`, err)
        throw err
    }
}

