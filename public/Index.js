<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Awesome UI</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: linear-gradient(to right, #667eea, #764ba2);
      }
    </style>
  </head>
  <body class="min-h-screen flex items-center justify-center">
    <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
      <h1 class="text-3xl font-bold mb-4 text-purple-600">Welcome 👋</h1>
      <p class="text-gray-700 mb-6">This is a clean and attractive UI example deployed on Clever Cloud.</p>
      <a href="#" class="inline-block bg-purple-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-purple-700 transition">
        Let's Get Started
      </a>
    </div>

    <!-- Eruda Debug Tool for Mobile -->
    <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
    <script>eruda.init();</script>
  </body>
</html>
