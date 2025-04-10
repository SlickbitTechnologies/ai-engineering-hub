import express from "express";
import ViteExpress from "vite-express";
import db from './db.js';

const app = express();
app.use(express.json());

// Menu Items Routes
app.get("/api/menu-items", (req, res) => {
  db.all("SELECT * FROM menu_items", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post("/api/menu-items", (req, res) => {
  const { name, price, description, category, available } = req.body;
  console.log(req.body, 'sdkjsjfsfhk')
  db.run(
    "INSERT INTO menu_items (name, price, description, category, available) VALUES (?, ?, ?, ?, ?)",
    [name, price, description, category, available],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID });
    }
  );
});

app.put("/api/menu-items/:id", (req, res) => {
  const { name, price, description, category } = req.body;
  db.run(
    "UPDATE menu_items SET name = ?, price = ?, description = ?, category = ? WHERE id = ?",
    [name, price, description, category, req.params.id],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true });
    }
  );
});

app.delete("/api/menu-items/:id", (req, res) => {
  db.run("DELETE FROM menu_items WHERE id = ?", [req.params.id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true });
  });
});

//categories
app.get("/api/categories", (req, res) => {
  db.all("SELECT * FROM categories", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post("/api/categories", (req, res) => {
  const { name } = req.body;
  console.log(req.body, 'sasdadkjsjfsfhk')
  db.run(
    "INSERT INTO categories (name) VALUES (?)",
    [name],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID });
    }
  );
});

app.put("/api/categories/:id", (req, res) => {
  const { name } = req.body;
  db.run(
    "UPDATE categories SET name = ? WHERE id = ?",
    [name, req.params.id],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true });
    }
  );
});

app.delete("/api/categories/:id", (req, res) => {
  console.log(req.params.id, 'sdkjhfksdjghf')
  db.run("DELETE FROM categories WHERE id = ?", [req.params.id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true });
  });
});

// Orders Routes
app.get("/api/orders", (req, res) => {
  db.all(
    `SELECT 
      o.*,
      GROUP_CONCAT(
        json_object(
          'id', mi.id,
          'name', mi.name,
          'price', mi.price,
          'quantity', oi.quantity
        ), '||'  -- Use custom separator
      ) as items_json
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
    GROUP BY o.id
    ORDER BY o.timestamp DESC`,
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Parse the items JSON for each row
      const processedRows = rows.map(row => {
        try {
          // Handle null or empty items_json
          if (!row.items_json) {
            row.items = [];
          } else {
            // Split by custom separator and parse each JSON object
            row.items = row.items_json.split('||').map(itemStr => {
              try {
                return JSON.parse(itemStr);
              } catch (parseErr) {
                console.error('Error parsing item JSON:', itemStr);
                return null;
              }
            }).filter(item => item !== null);
          }
          
          // Remove the raw JSON string from the response
          delete row.items_json;
          return row;
        } catch (e) {
          console.error('Error processing row:', e);
          return { ...row, items: [] };
        }
      });

      res.json(processedRows);
    }
  );
});

app.post("/api/process-order", async (req, res) => {
  const { items } = req.body;
  console.log(req.body, 'sdjkfhksjdfg')
  console.log(items, 'itemsdkjfhfk')
  // Simple items processing to match menu items
  // In a real application, you would use NLP or a more sophisticated matching system
  try {
    const menuItems = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM menu_items", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const matchedItems = menuItems.filter(item =>
      items?.toLowerCase().includes(item?.name?.toLowerCase())
    );

    console.log(matchedItems, 'matchedItemsdjfh')
    if (matchedItems.length === 0) {
      res.json({ items: [] });
      return;
    }

    // Calculate total
    const total = matchedItems.reduce((sum, item) => sum + item.price, 0);

    // Create order
    const order = await new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO orders (total) VALUES (?)",
        [total],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, total });
        }
      );
    });

    // Create order items
    await Promise.all(matchedItems.map(item =>
      new Promise((resolve, reject) => {
        db.run(
          "INSERT INTO order_items (order_id, menu_item_id) VALUES (?, ?)",
          [order.id, item.id],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      })
    ));

    res.json({ items: matchedItems, orderId: order.id, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/orders/:id/start", (req, res) => {
  db.run(
    "UPDATE orders SET status = ? WHERE id = ?",
    ["preparing", req.params.id],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true });
    }
  );
});

const port = process.env.PORT || 3001;
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

ViteExpress.bind(app, server);

export default app;
