const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.render('index');
})

app.listen(8080, process.env.IP, () => {
    console.log('Server running')
})