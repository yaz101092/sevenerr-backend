import { logger } from '../../services/logger.service.js'
import { gigService } from './gig.service.js';

export async function getGigs(req, res) {
  try {
    const filterBy = {
      txt: req.query.txt || '',
      category: req.query.category || '',
      tagFilter: req.query.tagFilter || '', // כאן לשים tagFilter!
      minPrice: req.query.minPrice ? +req.query.minPrice : undefined,
      maxPrice: req.query.maxPrice ? +req.query.maxPrice : undefined,
      deliveryTime: req.query.deliveryTime ? +req.query.deliveryTime :
      req.query.daysToMake ? +req.query.daysToMake : undefined,
      sellerRateFilter: req.query.sellerRateFilter ? +req.query.sellerRateFilter : undefined, // היה sellerRateFilte (חסר r)
      sortField: req.query.sortBy || '',
      sortDir: req.query.sortDir ? +req.query.sortDir : undefined,
      pageIdx: req.query.pageIdx ? +req.query.pageIdx : undefined,
    }

    // תדפיס כאן לבדוק
    console.log('FILTER BY:', filterBy);
    console.log('QUERY:', req.query)

    const gigs = await gigService.query(filterBy)
    res.json(gigs)
  } catch (err) {
    logger.error('Failed to get gigs', err)
    res.status(500).send({ err: 'Failed to get gigs' })
  }
}


export async function getGigById(req, res) {
	try {
		const gigId = req.params.id
		const gig = await gigService.getById(gigId)
        if (!gig) {
            return res.status(404).send({ err: 'Gig not found' })
        }
		res.json(gig)
	} catch (err) {
		logger.error('Failed to get gig', err)
		res.status(500).send({ err: 'Failed to get gig' })
	}
}

// export async function addGig(req, res) {
//   const { loggedinUser } = req
//   try {
//     const gigData = req.body
//     if (!loggedinUser || loggedinUser._id !== gigData.owner._id) {
//       return res.status(403).send({ err: 'Not allowed to add gig' })
//     }
//     const savedGig = await gigService.add(gigData)
//     res.json(savedGig)
//   } catch (err) {
//     logger.error('Failed to add gig', err)
//     res.status(500).send({ err: 'Failed to add gig' })
//   }
// }
// ב־gig.controller.js

export async function addGig(req, res) {
  const { loggedinUser } = req;
  try {
    // 1. מקבלים את כל השדות בדיוק כפי שנשלחו מה-frontend
    const {
      category,
      title,
      about,
      price,
      owner,
      country,
      daysToMake,
      description,
      imgUrl,         // מערך של מחרוזות
      tags,
      likedByUsers,
      reviews
    } = req.body;

    // 2. מנוע הרשאות: לוודא שה-owner מגיע מ-currentUser
    if (!owner || loggedinUser._id !== owner._id) {
      return res
        .status(403)
        .send({ err: 'Not allowed to add gig' });
    }

    // 3. בונים את האובייקט בדיוק במפתחות התואמים לדוגמה שלך
    const gigToInsert = {
      category: category || 'General',
      title: title || 'Untitled Gig',
      about: about || '',               // אם לא נשלח – ריק
      price: +price || 0,
      owner: {
        _id: owner._id,
        fullname: owner.fullname,
        imgUrl: owner.imgUrl,
        level: owner.level || 2,
        rate: owner.rate || 4.0
      },
      country: country || 'Unknown',
      daysToMake: +daysToMake || 7,
      description: description || '',
      imgUrl: Array.isArray(imgUrl) ? imgUrl : [],
      tags: Array.isArray(tags) ? tags : [],
      likedByUsers: Array.isArray(likedByUsers) ? likedByUsers : [],
      reviews: Array.isArray(reviews) ? reviews : []
      // אין פה שדה packages או שדות נוספים, כדי להשאיר בדיוק את המפתח 
      // כפי שמופיע בדוגמה שלך.
    };

    // 4. מבצעים שמירה ב-MongoDB (raw) – dbService.insertOne
    const savedGig = await gigService.add(gigToInsert);
    // 5. שולחים בחזרה את ה-savedGig עם אותו מבנה
    res.json(savedGig);

  } catch (err) {
    logger.error('Failed to add gig', err);
    res.status(500).send({ err: 'Failed to add gig' });
  }
}

// export async function updateGig(req, res) {
//   const { loggedinUser } = req
//   try {
//     const gigData = req.body
//     if (!loggedinUser.isAdmin && gigData.owner._id !== loggedinUser._id) {
//       return res.status(403).send({ err: 'Not allowed to update gig' })
//     }
//     const updatedGig = await gigService.update(gigData)
//     res.json(updatedGig)
//   } catch (err) {
//     logger.error('Failed to update gig', err)
//     res.status(500).send({ err: 'Failed to update gig' })
//   }
// }

export async function updateGig(req, res) {
	const { loggedinUser, body: gig } = req
    const { _id: userId, isAdmin } = loggedinUser

    if(!isAdmin && gig.owner._id !== userId) {
        res.status(403).send('Not your gig...')
        return
    }

    try {
        const { _id, category, daysToMake, description, imgUrls, likedByUsers, owner, packages, price, tags, title } = req.body
        const gig = {
            _id,
            category,
            daysToMake,
            description,
            imgUrls,
            likedByUsers,
            owner,
            packages,
            price: +price,
            tags,
            title,
        }
        const updatedGig = await gigService.update(gig)
        res.json(updatedGig)
    } catch (err) {
		logger.error('Failed to update gig', err)
		res.status(500).send({ err: 'Failed to update gig' })
    }
}

export async function removeGig(req, res) {
  try {
    const gigId = req.params.id
    // req.loggedinUser נקבע ע״י requireAuth
    const { _id: userId, isAdmin } = req.loggedinUser

    // כאן מעביר את userId ו־isAdmin ישר ל־service
    await gigService.removeById(gigId, userId, isAdmin)

    // אם הצליח – נחזיר 204
    res.sendStatus(204)
  } catch (err) {
    logger.error('Failed to remove gig', err)
    if (err.message.includes('Not authorized')) {
      return res.status(403).send({ err: err.message })
    }
    res.status(500).send({ err: 'Failed to remove gig' })
  }
}

export async function addGigMsg(req, res) {
	const { loggedinUser } = req

	try {
		const gigId = req.params.id
		const msg = {
			txt: req.body.txt,
			by: loggedinUser,
		}
		const savedMsg = await gigService.addGigMsg(gigId, msg)
		res.json(savedMsg)
	} catch (err) {
		logger.error('Failed to update gig', err)
		res.status(400).send({ err: 'Failed to update gig' })
	}
}

export async function removeGigMsg(req, res) {
	try {
		const { id: gigId, msgId } = req.params

		const removedId = await gigService.removeGigMsg(gigId, msgId)
		res.send(removedId)
	} catch (err) {
		logger.error('Failed to remove gig msg', err)
		res.status(400).send({ err: 'Failed to remove gig msg' })
	}
}
