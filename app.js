// packages.
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

// body parser
app.use(bodyParser.urlencoded({ extended: true }));
// static css.
app.use(express.static("public"));

// setting ejs.
app.set("view engine", "ejs");

// creating connetion with mongodb database.
mongoose.connect(
  //! do not forget to add cluster link here.
  "add your mongoDB cluster here",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  }
);

// schema for items data.
const itemsSchema = {
  name: String,
};

// data model for the above schema.
const Item = mongoose.model("Item", itemsSchema);

// initial documents.
const item1 = new Item({
  name: "Welcome to your todo list!",
});

const item2 = new Item({
  name: "Hit the + button to add the new item",
});

const item3 = new Item({
  name: "<-- hit this to delete any item",
});

const defaultItems = [item1, item2, item3];

// new list schema.
const listSchema = {
  name: String,
  listItems: [itemsSchema],
};

// model for the list schema.
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find(function (error, items) {
    if (error) {
      console.log(error);
    } else {
      if (items.length === 0) {
        // insert the documents to todolistDB.
        Item.insertMany(defaultItems, function (error) {
          if (error) {
            console.log(error);
          } else {
            console.log("Inserted successfully!");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", {
          listTitle: "Home",
          newItems: items,
        });
      }
    }
  });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (error, foundList) {
    if (!error) {
      if (!foundList) {
        // create a new list.
        console.log("Doesn't exist");
        const list = new List({
          name: customListName,
          listItems: defaultItems,
        });
        list.save();

        res.redirect(`/${customListName}`);
      } else {
        // show the found list.
        res.render("list", {
          listTitle: foundList.name,
          newItems: foundList.listItems,
        });
      }
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName,
  });

  // if it is the home route, then same the new item and redirect to home route.
  if (listName === "Home") {
    newItem.save();

    res.redirect("/");
  } else {
    // if it is the custom route, then first find that from the list.
    List.findOne({ name: listName }, function (error, foundList) {
      // and add item into that list
      foundList.listItems.push(newItem);
      foundList.save();
      // now redirect to the typed route.
      res.redirect(`/${listName}`);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Home") {
    Item.findByIdAndRemove(checkedItemId, function (error) {
      if (!error) {
        console.log("Item successfully deleted!");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { listItems: { _id: checkedItemId } } },
      function (error, foundList) {
        if (!error) {
          res.redirect(`/${listName}`);
        }
      }
    );
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log(`Server is listing at : http://localhost:${port}`);
});
