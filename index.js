require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const dns = require("dns");
const validUrl = require("valid-url");
// Basic Configuration
const port = process.env.PORT || 3000;
async function connect() {
  try {
    console.log(`Tentando conectar-se com o banco de dados...`);
    await mongoose.connect(process.env.MONGO_URL, {
      // useCreateIndex: true,
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // useFindAndModify: false,
    });
    console.log(`Conectado!`);
  } catch (e) {
    console.log(`Erro ao tentar contectar ao banco de dados: ${e.message}`);
  }
}
(async function initiate() {
  await connect();
})();
// SCHEMA
let Schema = mongoose.Schema;
const UrlSchema = new Schema({
  original_url: { type: String },
  short_url: { type: mongoose.SchemaTypes.ObjectId },
});

const UrlModel = mongoose.model("short_url", UrlSchema);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", async function (req, res) {
  const { url } = req.body;

  console.log(validUrl.isUri(url));
  if (validUrl.isUri(url)) {
    let urlDoc = await UrlModel.findOne({ original_url: url });
    if (urlDoc) {
      return res.json({
        original_url: urlDoc.original_url,
        short_url: urlDoc.short_url,
      });
    }

    let newUrl = await UrlModel.create({
      original_url: url,
    });
    newUrl.short_url = newUrl._id;
    await newUrl.save();

    return res.json({
      original_url: newUrl.original_url,
      short_url: newUrl.short_url,
    });
  } else {
    return res.json({ error: "invalid url" });
  }
});
app.get("/api/shorturl/:url", async (req, res) => {
  const { url } = req.params;

  const urlDoc = await UrlModel.findById(url);
  if (urlDoc) {
    res.redirect(urlDoc.original_url);
  } else {
    return res.json("url dont exist");
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
