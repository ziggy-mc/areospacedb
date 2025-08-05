const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Simple route for testing
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
