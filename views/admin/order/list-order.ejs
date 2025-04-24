<!-- Order Management Page -->
<div class="container mx-auto px-4 py-6">
  <h1 class="text-3xl font-bold text-center mb-6 text-gray-800">Order Management</h1>

  <!-- Status Filter -->
  <div class="flex flex-wrap gap-2 mb-4">
    <button class="status-filter px-3 py-1 rounded bg-blue-500 text-white" data-status="all">All</button>
    <button class="status-filter px-3 py-1 rounded bg-gray-100 text-gray-700" data-status="pending">Pending</button>
    <button class="status-filter px-3 py-1 rounded bg-yellow-100 text-yellow-700" data-status="in progress">In Progress</button>
    <button class="status-filter px-3 py-1 rounded bg-green-100 text-green-700" data-status="completed">Completed</button>
    <button class="status-filter px-3 py-1 rounded bg-red-100 text-red-700" data-status="cancelled">Cancelled</button>
  </div>

  <!-- Search -->
  <div class="mb-4 max-w-md">
    <input type="text" id="orderSearchInput" placeholder="Search by Location" class="w-full p-2 border border-gray-300 rounded">
  </div>

  <!-- Form Table -->
  <form id="updateOrdersForm" method="POST" action="/orders/update">
    <table class="min-w-full bg-white border border-gray-300 rounded shadow-md">
      <thead>
        <tr class="bg-gray-100 text-left">
          <th class="p-3 border-b">Order ID</th>
          <th class="p-3 border-b">User ID</th>
          <th class="p-3 border-b">Location</th>
          <th class="p-3 border-b">Status</th>
          <th class="p-3 border-b">Total Price</th>
          <th class="p-3 border-b">Actions</th>
        </tr>
      </thead>
      <tbody id="orderTableBody">
        <% orders.forEach((order, i) => { %>
          <tr data-status="<%= order.status.toLowerCase() %>">
            <td class="p-3 border-b"><%= order.orderId %></td>
            <td class="p-3 border-b"><%= order.userId %></td>
            <td class="p-3 border-b"><%= order.location %></td>
            <td class="p-3 border-b">
              <select name="orders[<%= i %>][status]" class="border p-1 rounded w-full">
                <option value="pending" <%= order.status === 'pending' ? 'selected' : '' %>>Pending</option>
                <option value="in progress" <%= order.status === 'in progress' ? 'selected' : '' %>>In Progress</option>
                <option value="completed" <%= order.status === 'completed' ? 'selected' : '' %>>Completed</option>
                <option value="cancelled" <%= order.status === 'cancelled' ? 'selected' : '' %>>Cancelled</option>
              </select>
              <input type="hidden" name="orders[<%= i %>][orderId]" value="<%= order.orderId %>">
            </td>
            <td class="p-3 border-b">
              <input type="number" name="orders[<%= i %>][totalPrice]" value="<%= order.totalPrice %>" class="border p-1 w-full rounded">
            </td>
            <td class="p-3 border-b">
              <a href="/orders/<%= order.orderId %>" class="text-blue-500 hover:text-blue-600"><i class="fas fa-eye"></i> View</a>
            </td>
          </tr>
        <% }) %>
      </tbody>
    </table>

    <!-- Pagination Controls -->
    <div class="mt-4 flex justify-end space-x-2" id="orderPaginationContainer"></div>

    <!-- Submit Button -->
    <div class="mt-6 text-right">
      <button type="submit" class="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">
        Save Changes
      </button>
    </div>
  </form>
</div>

<!-- JS for Filtering, Search, and Pagination -->
<script>
  const orderSearchInput = document.getElementById('orderSearchInput');
  const orderTableBody = document.getElementById('orderTableBody');
  const orderRows = Array.from(orderTableBody.querySelectorAll('tr'));
  const orderPaginationContainer = document.getElementById('orderPaginationContainer');
  const statusFilters = document.querySelectorAll('.status-filter');

  let currentPage = 1;
  const rowsPerPage = 5;
  let filteredRows = orderRows;

  orderSearchInput.addEventListener('input', () => applyFilters());

  statusFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      statusFilters.forEach(b => b.classList.remove('bg-blue-500', 'text-white'));
      btn.classList.add('bg-blue-500', 'text-white');
      btn.classList.remove('bg-gray-100', 'bg-yellow-100', 'bg-green-100', 'bg-red-100', 'text-gray-700', 'text-yellow-700', 'text-green-700', 'text-red-700');
      currentPage = 1;
      applyFilters();
    });
  });

  function applyFilters() {
    const query = orderSearchInput.value.toLowerCase();
    const activeStatus = document.querySelector('.status-filter.bg-blue-500')?.dataset.status;

    filteredRows = orderRows.filter(row => {
      const status = row.dataset.status;
      const location = row.cells[2].textContent.toLowerCase();
      const matchesSearch = location.includes(query);
      const matchesStatus = (activeStatus === 'all' || status === activeStatus);
      return matchesSearch && matchesStatus;
    });

    displayOrderPage(currentPage);
  }

  function displayOrderPage(page) {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    orderRows.forEach(row => row.style.display = 'none');
    filteredRows.slice(start, end).forEach(row => row.style.display = '');

    renderOrderPagination();
  }

  function renderOrderPagination() {
    orderPaginationContainer.innerHTML = '';
    const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = `px-3 py-1 rounded border text-sm ${
        i === currentPage 
          ? 'bg-blue-500 text-white border-blue-500' 
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
      }`;
      btn.addEventListener('click', () => {
        currentPage = i;
        displayOrderPage(currentPage);
      });
      orderPaginationContainer.appendChild(btn);
    }
  }

  applyFilters();
</script>
