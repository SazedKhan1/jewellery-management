"use client";

import { useEffect, useState } from "react";

export default function CategoriesPage() {

  const [categories, setCategories] = useState([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");


  // Load categories
  const loadCategories = async () => {

    try {

      const response = await fetch("/api/categories");

      const data = await response.json();

      if (response.ok) {
        setCategories(data);
      }

    } catch (error) {

      console.error("Load Category Error:", error);

    }

  };


  useEffect(() => {

    loadCategories();

  }, []);


  // Add category
  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!name.trim()) {

      setMessage("Category name is required.");

      return;

    }

    setLoading(true);
    setMessage("");


    try {

      const response = await fetch("/api/categories", {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name,
          description,
        }),

      });


      const data = await response.json();


      if (!response.ok) {

        setMessage(data.message || "Something went wrong.");

        return;

      }


      setMessage("Category added successfully.");

      setName("");
      setDescription("");

      await loadCategories();


    } catch (error) {

      console.error("Add Category Error:", error);

      setMessage("Server error.");

    } finally {

      setLoading(false);

    }

  };


  return (

    <main
      style={{
        minHeight: "100vh",
        background: "#f7f7f7",
        padding: "40px",
      }}
    >

      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >

        <h1
          style={{
            fontSize: "32px",
            marginBottom: "8px",
          }}
        >
          Jewellery Categories
        </h1>


        <p
          style={{
            color: "#777",
            marginBottom: "30px",
          }}
        >
          Manage your jewellery product categories.
        </p>


        {/* Add Category */}

        <div
          style={{
            background: "#fff",
            padding: "25px",
            borderRadius: "12px",
            border: "1px solid #e5e5e5",
            marginBottom: "30px",
          }}
        >

          <h2
            style={{
              marginBottom: "20px",
            }}
          >
            Add Category
          </h2>


          <form onSubmit={handleSubmit}>

            <div
              style={{
                marginBottom: "15px",
              }}
            >

              <label>
                Category Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Example: Gold Jewellery"
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "7px",
                  border: "1px solid #ddd",
                  borderRadius: "7px",
                }}
              />

            </div>


            <div
              style={{
                marginBottom: "20px",
              }}
            >

              <label>
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="Category description"
                rows="4"
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "7px",
                  border: "1px solid #ddd",
                  borderRadius: "7px",
                  resize: "vertical",
                }}
              />

            </div>


            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 22px",
                background: "#111",
                color: "#fff",
                border: "none",
                borderRadius: "7px",
                cursor: "pointer",
              }}
            >

              {loading ? "Saving..." : "Add Category"}

            </button>


            {message && (

              <p
                style={{
                  marginTop: "15px",
                }}
              >
                {message}
              </p>

            )}

          </form>

        </div>


        {/* Category List */}

        <div
          style={{
            background: "#fff",
            padding: "25px",
            borderRadius: "12px",
            border: "1px solid #e5e5e5",
          }}
        >

          <h2>
            Category List
          </h2>


          {categories.length === 0 ? (

            <p
              style={{
                color: "#888",
                marginTop: "20px",
              }}
            >
              No categories found.
            </p>

          ) : (

            <div
              style={{
                overflowX: "auto",
                marginTop: "20px",
              }}
            >

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >

                <thead>

                  <tr>

                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px",
                        borderBottom: "1px solid #ddd",
                      }}
                    >
                      ID
                    </th>

                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px",
                        borderBottom: "1px solid #ddd",
                      }}
                    >
                      Category
                    </th>

                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px",
                        borderBottom: "1px solid #ddd",
                      }}
                    >
                      Description
                    </th>

                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px",
                        borderBottom: "1px solid #ddd",
                      }}
                    >
                      Status
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {categories.map((category) => (

                    <tr key={category.id}>

                      <td
                        style={{
                          padding: "12px",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        {category.id}
                      </td>

                      <td
                        style={{
                          padding: "12px",
                          borderBottom: "1px solid #eee",
                          fontWeight: "600",
                        }}
                      >
                        {category.name}
                      </td>

                      <td
                        style={{
                          padding: "12px",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        {category.description || "-"}
                      </td>

                      <td
                        style={{
                          padding: "12px",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        {category.status
                          ? "Active"
                          : "Inactive"}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

    </main>

  );

}