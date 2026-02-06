const express = require("express")
const { open } = require("sqlite")
const sqlite3 = require("sqlite3")
const path = require("path")
const cors = require("cors");
const app = express()
app.use(express.json())
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const dbPath = path.join(__dirname, "collegeInformation.db")
let db = null

const PORT = process.env.PORT || 3000;


const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    })
    app.listen(PORT, () => {
      console.log(`Server Running on port ${PORT}.....`)
    })

  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }

}

initializeDBAndServer()



app.post("/colleges", async (request, response) => {
  const collegeDetails = request.body
  const { collegeName, location, course, fee, isFavorite } = collegeDetails
  const addCollegeQuery = `
    INSERT INTO 
    college (collage_name, location, course, fee, is_favorite)
    VALUES 
    ('${collegeName}', '${location}', '${course}', ${fee}, ${isFavorite});`
  const dbResponse = await db.run(addCollegeQuery)
  const collegeId = dbResponse.lastID
  response.send({ collegeId: collegeId })
})


app.get("/colleges/:collegeId", async (request, response) => {
  const { collegeId } = request.params
  const getCollegeQuery = `SELECT * FROM college WHERE college_id = ${collegeId};`
  const college = await db.get(getCollegeQuery)
  response.send(college)
})

app.put("/colleges/:collegeId", async (request, response) => {
  const { collegeId } = request.params
  const collegeDetails = request.body
  const { collegeName, location, course, fee, isFavorite } = collegeDetails
  const updateCollegeQuery = `
    UPDATE college
    SET collage_name = '${collegeName}', 
    location = '${location}',
     course = '${course}',
     fee = ${fee}, 
     is_favorite = ${isFavorite}
    WHERE college_id = ${collegeId};`

  await db.run(updateCollegeQuery)
  response.send("College Details Updated")
})


app.get("/reviews", async (req, res) => {
  try {
    const query = `SELECT * FROM reviews;`;
    const rows = await db.all(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});


app.delete("/colleges/:collegeId", async (request, response) => {
  const { collegeId } = request.params
  const deleteCollegeQuery = `DELETE FROM college WHERE college_id = ${collegeId};`
  await db.run(deleteCollegeQuery)
  response.send("College Removed")
})
app.get("/favorites", async (request, response) => {
  const getFavoritesQuery = `
    SELECT * FROM college WHERE is_favorite = 1;`
  const favoritesArray = await db.all(getFavoritesQuery)
  response.send(favoritesArray)
})

app.put("/favorites/:collegeId", async (request, response) => {
  const { collegeId } = request.params
  const updateFavoriteQuery = `UPDATE college SET is_favorite = 1 WHERE college_id = ${collegeId};`
  await db.run(updateFavoriteQuery)
  response.send("College Marked as Favorite")
})

app.delete("/favorites/:collegeId", async (request, response) => {
  const { collegeId } = request.params
  const deleteFavoriteQuery = `UPDATE college SET is_favorite = 0 WHERE college_id = ${collegeId};`
  await db.run(deleteFavoriteQuery)
  response.send("College Unmarked as Favorite")
})

app.get('/colleges', async (req, res) => {
  try {
    let query = 'SELECT * FROM college WHERE 1=1';
    const params = [];

    if (req.query.searchQuery) {
      query += ' AND collage_name LIKE ?';
      params.push(`%${req.query.searchQuery}%`);
    }

    if (req.query.location) {
      query += ' AND location = ?';
      params.push(req.query.location);
    }

    if (req.query.course) {
      query += ' AND course = ?';
      params.push(req.query.course);
    }

    if (req.query.minFee) {
      query += ' AND fee >= ?';
      params.push(Number(req.query.minFee));
    }

    if (req.query.maxFee) {
      query += ' AND fee <= ?';
      params.push(Number(req.query.maxFee));
    }

    if (req.query.sortBy === 'fee_asc') {
      query += ' ORDER BY fee ASC';
    } else if (req.query.sortBy === 'fee_desc') {
      query += ' ORDER BY fee DESC';
    }

    const rows = await db.all(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = app
