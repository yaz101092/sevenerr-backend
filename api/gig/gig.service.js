import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'
// import { makeId } from '../../services/util.service.js'
import { ObjectId } from 'mongodb'
// import { PAGE_SIZE } from '../config.js'

export const gigService = {
	remove,
	query,
	getById,
	add,
	update,
	addGigMsg,
	removeGigMsg,
}

async function query(filterBy = {}) {
    // { minPrice: '', maxPrice: '', txt: '', category: '', tags: [], daysToMake: '', Level: '', userId: '', sortBy: '' }
	try {
		// console.log('==============================')
    	// console.log('GIG QUERY FILTER', filterBy)  
		// console.log('criteria:', criteria)
		const criteria = _buildCriteria(filterBy)
        const sort = _buildSort(filterBy)

		const collection = await dbService.getCollection('gigs')
		// console.log(collection);
		
		var gigCursor = await collection.find(criteria, { sort })

		// if (filterBy.pageIdx !== undefined) {
		// 	gigCursor.skip(filterBy.pageIdx * PAGE_SIZE).limit(PAGE_SIZE)
		// }

		const gigs = await gigCursor.toArray()
		return gigs
	} catch (err) {
		logger.error('cannot find gigs', err)
		throw err
	}
}

async function getById(gigId) {
	try {
        const criteria = { _id: ObjectId.createFromHexString(gigId) }

		const collection = await dbService.getCollection('gigs')
		const gig = await collection.findOne(criteria)
        
		gig.createdAt = gig._id.getTimestamp()
		return gig
	} catch (err) {
		logger.error(`while finding gig ${gigId}`, err)
		throw err
	}
}

async function remove(gigId) {
    const { loggedinUser } = asyncLocalStorage.getStore()
    const { _id: ownerId, isAdmin } = loggedinUser

	try {
        const criteria = { 
            _id: ObjectId.createFromHexString(gigId), 
        }
        if(!isAdmin) criteria['owner._id'] = ownerId
        
		const collection = await dbService.getCollection('gigs')
		const res = await collection.deleteOne(criteria)

        if(res.deletedCount === 0) throw('Not your gig')
		return gigId
	} catch (err) {
		logger.error(`cannot remove gig ${gigId}`, err)
		throw err
	}
}

async function add(gig) {
	try {
		const collection = await dbService.getCollection('gigs')
		await collection.insertOne(gig)

		return gig
	} catch (err) {
		logger.error('cannot insert gig', err)
		throw err
	}
}

async function update(gig) {

    try {
        const gigToSave =
        {
            category: gig.category,
            daysToMake: gig.daysToMake,
            description: gig.description,
            imgUrls: gig.imgUrls,
            likedByUsers: gig.likedByUsers,
            packages: gig.packages,
            price: +gig.price,
            tags: gig.tags,
            title: gig.title
        }
        const criteria = { _id: ObjectId.createFromHexString(gig._id) }

		const collection = await dbService.getCollection('gigs')
		await collection.updateOne(criteria, { $set: gigToSave })

		return gig
	} catch (err) {
		logger.error(`cannot update gig ${gig._id}`, err)
		throw err
	}
}

async function addGigMsg(gigId, msg) {
	try {
        const criteria = { _id: ObjectId.createFromHexString(gigId) }
        msg.id = makeId()
        
		const collection = await dbService.getCollection('gigs')
		await collection.updateOne(criteria, { $push: { msgs: msg } })

		return msg
	} catch (err) {
		logger.error(`cannot add gig msg ${gigId}`, err)
		throw err
	}
}

async function removeGigMsg(gigId, msgId) {
	try {
        const criteria = { _id: ObjectId.createFromHexString(gigId) }

		const collection = await dbService.getCollection('gigs')
		await collection.updateOne(criteria, { $pull: { msgs: { id: msgId }}})
        
		return msgId
	} catch (err) {
		logger.error(`cannot remove gig msg ${gigId}`, err)
		throw err
	}
}

function _buildCriteria(filterBy) {
  const criteria = {}

  // חיפוש טקסט בעמודת ה-title
  if (filterBy.txt) {
    criteria.title = { $regex: filterBy.txt, $options: 'i' }
  }
  // סינון לפי קטגוריה
  if (filterBy.category) {
    criteria.category = filterBy.category
  }
  // סינון לפי תג (tagFilter)
	if (filterBy.tagFilter) {
	criteria.tags = { $in: [filterBy.tagFilter] }
	}
  // סינון לפי טווח מחיר
  if (filterBy.minPrice != null || filterBy.maxPrice != null) {
    criteria.price = {}
    if (filterBy.minPrice != null) criteria.price.$gte = filterBy.minPrice
    if (filterBy.maxPrice != null) criteria.price.$lte = filterBy.maxPrice
  }
  // סינון לפי זמן אספקה מקסימלי
  if (filterBy.deliveryTime) {
    criteria.daysToMake = { $lte: filterBy.deliveryTime }
  }
  // סינון לפי דירוג מוכר מינימלי
  if (filterBy.sellerRateFilter) {
    criteria['owner.rate'] = { $gte: filterBy.sellerRateFilter }
  }

  return criteria
}

function _buildSort(filterBy) {
  if (!filterBy.sortField) return null
  return { [filterBy.sortField]: filterBy.sortDir || 1 }
}

// function _buildCriteria(filterBy) {
// 	console.log(filterBy);
	
//     const criteria = {
//         title: { $regex: filterBy.txt? filterBy.txt: "", $options: 'i' },
//         severity: { $gte: filterBy.minSeverity },
//     }

//     return criteria
// }

// function _buildSort(filterBy) {
//     if(!filterBy.sortField) return {}
//     return { [filterBy.sortField]: filterBy.sortDir }
// }

// function buildCriteria(filterBy) {
//     const criteria = {}
//     if (filterBy.minPrice || filterBy.maxPrice) criteria['packages.basic.packPrice'] = {};

//     if (filterBy.minPrice && filterBy.maxPrice) {
//         if (filterBy.minPrice > filterBy.maxPrice) {
//             // Swap minPrice and maxPrice
//             // const temp = filterBy.minPrice;
//             // filterBy.minPrice = filterBy.maxPrice;
//             // filterBy.maxPrice = temp;
//             [filterBy.minPrice, filterBy.maxPrice] = [filterBy.maxPrice,filterBy.minPrice]
//             criteria['packages.basic.packPrice'] = {
//                 $gte: filterBy.minPrice,
//                 $lte: filterBy.maxPrice
//             }
//         } else {
//             // Use the $gte and $lte operators directly
//             criteria['packages.basic.packPrice'] = {
//                 $gte: filterBy.minPrice,
//                 $lte: filterBy.maxPrice
//             }
//         }
//     }

//     else if (filterBy.minPrice) {
//         criteria['packages.basic.packPrice'] = {$gte :filterBy.minPrice};
//     }

//     else if (filterBy.maxPrice) {
//         criteria['packages.basic.packPrice'] = {$lte: filterBy.maxPrice}
//     }

//     if (filterBy.category) {
//         criteria.category = filterBy.category;
//     }

//     if (filterBy.tags && filterBy.tags.length > 0) {
//         criteria.tags = { $elemMatch: { $in: filterBy.tags } }
//     }

//     if (filterBy.userId) {
//         criteria['owner._id'] = filterBy.userId;
//     }

//     if (filterBy.daysToMake) {
//         criteria['packages.basic.packDaysToMake'] = { $lte: filterBy.daysToMake };
//     }


//     //check if works
//     if (filterBy.topRated) {
//         criteria['owner.rate'] = { $gte: 5 };
//     }
//     //need to work
//     if (filterBy.basicLevel && filterBy.premiumLevel) {
//         criteria['owner.level'] = { $in: [1, 2] };
//     } else if (filterBy.basicLevel) {
//         criteria['owner.level'] = 1;
//     } else if (filterBy.premiumLevel) {
//         criteria['owner.level'] = 2;
//     }

//     //works!!
//     if (filterBy.txt) {
//         const regex = new RegExp(filterBy.txt, 'i');
//         criteria.$or = [
//             { 'tags': { $elemMatch: { $regex: regex } } },
//             { 'title': { $regex: regex } },
//             { 'description': { $regex: regex } }
//         ];
//     }

//     // if (filterBy.sortBy) {
//     //     switch (filterBy.sortBy) {
//     //         case 'new':
//     //             criteria.$sort = { createdAt: -1 }; // Sort by createdAt in descending order (newest first)
//     //             break;
//     //         case 'recommend':
//     //             criteria.$sort = { 'owner.rate': -1 }; // Sort by owner's rate in descending order (highest rate first)
//     //             break;
//     //     }
//     // }
//     return criteria
// }