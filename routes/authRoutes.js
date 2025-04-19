app.get('/', (req, res) => {
  res.render('home', { title: 'Home Page', layout: false });
});

app.get('/login', (req, res) => {
  res.render('login', { message: null, layout: false });
});
