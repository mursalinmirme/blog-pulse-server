const express = require('express');
const app = express();
const port = process.env.PORT || 5000;


app.get('/', (req, res) => {
    res.send('The blog puslse server is running');
})












app.listen(port, () => {
    console.log(`The current port ${port} is running.`);
})