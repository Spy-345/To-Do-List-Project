//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set("strictQuery", false);
mongoose.connect("mongodb://localhost:27017/ToDoList-DB", {useNewUrlParser : true});

const itemSchema = mongoose.Schema({
  name : String
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name : "Welcome to TO-DO list!"
});

const item2 = new Item({
  name : "Hit the + button to add New Item to the list."
});

const item3 = new Item({
  name : "Enter the item in the textfield."
});

const defaultItems = [item1, item2, item3];


app.get("/", function(req, res) {
  
  Item.find({}, function(err, foundItems)
   {
      if(foundItems.length === 0)
      {
        Item.insertMany(defaultItems, function(err){
            if(err)
            {
              console.log(err);
            }
            else
            {
              console.log("Items Successfully Saved into DataBase .");
            }
          });
          res.redirect("/");
      }
      else
      {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
    });
  });

  const listSchema = {
    name : String,
    items : [itemSchema]
  };

  const List = mongoose.model("List", listSchema);

  app.get("/:listName", function(req, res){
    const CustomListName = _.capitalize(req.params.listName);
    
    List.findOne({name: CustomListName}, function(err, foundList){
      if(!err)
      {
        if(!foundList)
        {
          const list = new List({
            name : CustomListName,
            items : defaultItems
          });
          list.save();
          res.redirect("/" + CustomListName);
        }
        else
        {
          res.render("list", {listTitle : foundList.name, newListItems : foundList.items})
        }
      }
      });

    });

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name : itemName
  })
  
  if(listName === "Today")
  {
    item.save();
    res.redirect("/");
  }
  else
  {
    List.findOne({name : listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
});

app.post("/delete", function(req, res){
 const checkedItemID = req.body.checkbox;
 const listName = req.body.listName;

 if(listName === "Today")
 {
    Item.findByIdAndDelete(checkedItemID, function(err){
      if(err)
      {
        console.log(err);
      }
      else
      {
        console.log("Item Removed Successfully.");
        res.redirect("/");
      }
    });
 }
 else
 {
    List.findOneAndUpdate({name : listName}, {$pull : {items : {_id : checkedItemID}}}, function(err, foundlist){
      if(!err)
      {
        res.redirect("/" + listName);
      }
    });
 }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
