Ext.namespace("lore.ore.model");
/** 
 * Manages the lists of Resource Maps which are 
 * the results of browse/search queries and stored in history
 * @class lore.ore.model.CompoundObjectListManager
 */
lore.ore.model.CompoundObjectListManager = function(){
    this.lists = {
        "search" : new Ext.ux.data.PagingJsonStore({
            idProperty : "uri",
            sortInfo: {
              field: "modified",
              direction: "desc"
            },
            storeId: "search",
            'data': [],
            lastOptions : {
                params : {
                    start : 0,
                    limit : lore.constants.pageSize
                }
            },
            fields : [{
                        "name" : "uri"
                    }, {
                        "name" : "title"
                    }, {
                        "name" : "creator"
                    }, {
                        "name" : "modified",
                        "type" : "date"
                    }, {
                        "name" : "accessed",
                        "type" : "date"
                    }, {
                        "name" : "match"
                    }, {
                        "name" : "isPrivate"
                    }, {
                    	"name" : "entryType"
                    }, {
                    	"name" : "type"
                    }, {
                    	"name" : "description"                    	
                    }, {
                    	"name" : "latitude"
                    }, {
                    	"name" : "longitude"
                    }, {
                    	"name" : "date_begin"
                    }, {
                    	"name" : "date_end"
                    }]
       }),
       "browse" : new Ext.ux.data.PagingJsonStore({
            idProperty : "uri",
            sortInfo: {
              field: "modified",
              direction: "desc"
            },
            storeId: "browse",
            data: [],
            lastOptions : {
                params : {
                    start : 0,
                    limit : lore.constants.pageSize
                }
            },
            fields : [{
                        "name" : "uri"
                    }, {
                        "name" : "title"
                    }, {
                        "name" : "creator"
                    }, {
                        "name" : "modified",
                        "type" : "date"
                    }, {
                        "name" : "accessed",
                        "type" : "date"
                    }, {
                        "name" : "match"
                    }, {
                        "name" : "isPrivate"
                    }, {
                    	"name" : "entryType"
                    }, {
                    	"name" : "type"
                    }, {
                    	"name" : "description"                    	
                    }, {
                    	"name" : "latitude"
                    }, {
                    	"name" : "longitude"
                    }, {
                    	"name" : "date_begin"
                    }, {
                    	"name" : "date_end"
                    }]
       }),
        "history" : new Ext.ux.data.PagingJsonStore({
            idProperty : "uri",
            sortInfo: {
              field: "accessed",
              direction: "desc"
            },
            storeId: "history",
            data: [],
            lastOptions : {
                params : {
                    start : 0,
                    limit : lore.constants.pageSize
                }
            },
            fields : [{
                        "name" : "uri"
                    }, {
                        "name" : "title"
                    }, {
                        "name" : "creator"
                    }, {
                        "name" : "modified",
                        "type" : "date"
                    }, {
                        "name" : "accessed",
                        "type" : "date"
                    }, {
                        "name" : "match"
                    }, {
                        "name" : "isPrivate"
                    }, {
                    	"name" : "entryType"
                    }, {
                    	"name" : "type"
                    }, {
                    	"name" : "description"                    	
                    }, {
                    	"name" : "latitude"
                    }, {
                    	"name" : "longitude"
                    }, {
                    	"name" : "date_begin"
                    }, {
                    	"name" : "date_end"
                    }]
       })
    };
};
Ext.apply(lore.ore.model.CompoundObjectListManager.prototype, {
    /**
     * Get one of the managed lists by name
     * 
     * @param {string}
     *            listname The name of the list to get
     * @return {lore.ore.model.CompoundObjectList} The list
     */
    getList : function(listname){
        return this.lists[listname];
    },
    /**
     * Add Resource Maps to a list
     * @param {Array} coSummaries Array of objects to be added
     * @param {String} listname The list to which to add the Resource Maps. If not supplied, the Resource Map will be added to the 'browse' list by default.
     */
    add: function(coSummaries, listname){
        if (!listname){
            listname = "browse";
        }
        var store = this.lists[listname];
        // reset to first page of results
        store.lastOptions={params:{start: 0,limit:lore.constants.pageSize}};
        if (coSummaries){
            try{
                store.loadData(coSummaries,true);  
            } catch (e){
                lore.debug.ore("Error adding to store",e);
            }
        }
    },
    /** Clear one of the managed lists
     * 
     * @param {String} listname The name of the list to clear
     */
    clear: function(listname){
        if (!listname){
            listname = "browse";   
        }
        var list = this.lists[listname];
        if (list.clearList){
            list.clearList();
        } else {
            list.removeAll();
        }
    },
    /**
     * Remove a Resource Map from all managed lists
     * @param {String} uri The URI of the Resource Map to removed
     */
    remove : function(uri){
        try{
          for (colist in this.lists){
            var list = this.lists[colist];
            var rec = list.getById(uri);
            if (rec){
                list.remove(rec);
            }
          }
        } catch (e){
            lore.debug.ore("Error removing from store " + uri,e);
        }
    },
    /**
     * Update some fields in the Resource Map
     * @param {} uri
     * @param {} fields
     */
    updateCompoundObject : function(uri,fields){
        for (colist in this.lists){
            var list = this.lists[colist];
            var rec = list.getById(uri);
            if (rec){
                for (p in fields){
                    rec.data[p] = fields[p];
                } 
                rec.commit(); 
            }
        }
    }
});
