/**
 * @class lore.ore.ui.DetailsPanel Display a text-heavy view of the entire Resource Map with embedded previews
 * @extends Ext.Panel
 */
lore.ore.ui.DetailsPanel = Ext.extend(Ext.Panel,{ 
   constructor: function (config){
        config = config || {};
        config.bodyCfg = { cls:'x-details-panel', 
        		style: "padding:20px;font-family: arial;font-size:90%; overflow: visible;"};
        config.bwrapStyle = "overflow: visible;";
        config.autoScroll = true;
        lore.ore.ui.DetailsPanel.superclass.constructor.call(this, config);
        this.loaded = "";
    },
    initComponent: function(){
        Ext.apply(this,{
            items: [{
                    xtype: "panel", // For Resource Map properties
                    border: false
                },
                {xtype: "detailsdataview", selectedClass: 'detailsselected'}]
        });
      lore.ore.ui.DetailsPanel.superclass.initComponent.call(this);
      this.on("activate", this.updateBinding);
    },
    /** Update model binding when panel is activated: in case loaded CO has changed 
     * @param {} p The panel
     */
    updateBinding : function (p) {
        try{
            Ext.MessageBox.show({
                   msg: 'Generating Summary',
                   width:250,
                   defaultTextHeight: 0,
                   closable: false,
                   cls: 'co-load-msg'
            });
            
            var currentCO = lore.ore.cache.getLoadedCompoundObject();
            // FIXME: adding resources to model causing errors when we attach directly
            //this.getComponent(1).bindStore(currentCO.aggregatedResourceStore);
            if (currentCO) {
            	var tmpCO = new lore.ore.model.CompoundObject();
            	tmpCO.load({format: 'rdfquery', content: currentCO.serialize('rdfquery')});
            	this.getComponent(1).bindStore(tmpCO.aggregatedResourceStore);
            	this.getComponent(0).body.update(lore.ore.ui.detailsCOTemplate.apply([currentCO]));
            }
            Ext.Msg.hide();
        } catch(e){
            lore.debug.ore("Error in updateBinding",e);
            Ext.Msg.hide();
        }
    },
    showResource: function(uri){
        Ext.getCmp("loreviews").activate(this.id);
        this.scrollToResource(uri);
    },
    scrollToResource: function(id){
        try{
            var dv = this.getComponent(1);
            if (dv){
                var node = Ext.get('s' + id);
                node.scrollIntoView(this.body, false);
                dv.select('s' + id);
            }
        } catch (e){
            lore.debug.ore("Error in scrollToResource",e);
        }
    }
});
Ext.reg('detailspanel',lore.ore.ui.DetailsPanel);

lore.ore.ui.detailsCOTemplate = new Ext.XTemplate(
    '<tpl for=".">',
    '<div style="width:100%">',
        '<table style="whitespace:normal;width:100%;font-family:arial;padding-bottom;0.5em"><tr><td>',
        '<span style="font-size:140%;font-weight:bold;color:#cc0000;">{[values.properties.getTitle() || "Untitled Resource Map"]}</span></td><td style="text-align:right" width="30">',
        /*'&nbsp;<a href="javascript:void(0);" onclick="lore.ore.controller.exportCompoundObject(\'wordml\');">',
        '<img src="' + lore.constants.baseUrl + 'skin/icons/ore/page_white_word.png" title="Export to MS Word"></a>',*/
        '</td></tr></table>',
        '<p style="font-style:italic;padding-bottom:0.3em;">{uri}</p>',
        '<tpl for="properties">{[this.displayProperties(values)]}</tpl>',
        '<p>&nbsp;</p>',
    '</div>',
    '</tpl>',
    {
        propTpl: new Ext.XTemplate('<tpl for="."><p style="padding-bottom:0.3em;"><span title="{id}" style="font-weight:bold">{[fm.capitalize(values.name)]}:&nbsp;&nbsp;</span>{value}</p></tpl>'),
        resourcePropValueTpl: new Ext.XTemplate('<a href="javascript:void(0);" title="Show {url} in browser" onclick="lore.util.launchTab(\'{url}\')">{title}</a>'),
        
        /** Custom function to display properties because XTemplate doesn't support wildcard for iterating over object properties 
         *  @param {lore.ore.model.ResourceProperties} o
         */
        displayProperties: function(o){
            var displayDate = function(cprop, desc){
                var cval;
                var datehtml = "";
                if (cprop){
                    cval = cprop.value;
                    if (Ext.isDate(cval)){
                        datehtml += desc + cval.format("j M Y");
                    } else {
                        datehtml += desc + cval;
                    }
                }
                return datehtml;
            };
          try {
            
            var ns = lore.constants.NAMESPACES;
            var dcterms = ns["dcterms"];
            var dc = ns["dc"];
            
            var res="";
            var ccreator = o.data[dc+"creator"];
            if (ccreator){
                res += "<p style='padding-bottom:0.5em'>Created";
                res += " by";
                for (var i = 0; i< ccreator.length; i++){
                     if (i > 0) {
                         res += ",";
                     }
                     res += "  " + ccreator[i].value;
                }
                res += displayDate(o.getProperty(dcterms+"created",0),' on ');
                res += displayDate(o.getProperty(dcterms+"modified",0), ', last updated ');
                res += "</p>";
            } 
            var csubject = o.data[dc+"subject"];
            if (csubject){
                res += '<p style="padding-bottom:0.3em;"><span style="font-weight:bold">Subject:&nbsp;&nbsp;</span>';
                var subjects = "";
                for (var i = 0; i < csubject.length; i++){
                    if (i > 0){
                        res += ", ";
                    }
                   var subj = csubject[i].value.toString();
                   if (subj.match("^http://") == "http://"){
                      res += this.resourcePropValueTpl.apply({url: subj, title:lore.ore.controller.lookupTag(subj)}); 
                   } else {
                      res += subj;
                   }
                   
                }
                res += "</p>";
            }
            var skipProps = {};
            skipProps[ns["ore"]+"describes"] = true;
            skipProps[dcterms+"created"] = true;
            skipProps[dcterms+"modified"] = true;
            skipProps[dc+"creator"] = true;
            skipProps[dc+"title"]=true;
            skipProps[ns["rdf"]+"type"]=true;
            skipProps[ns["lorestore"]+"user"]=true;
            skipProps[ns["dc"]+"subject"]=true;
            skipProps[ns["dc"]+"format"]=true;
            skipProps[ns["lorestore"] + "isLocked"]=true;
            var sortedProps = o.getSortedArray(skipProps);
            for (var k = 0; k < sortedProps.length; k ++){
                // don't display layout props: layout props may exist at this level if the user added the CO to itself
                var prop = sortedProps[k][0];
                if(prop && prop.prefix != "layout"){
                    res += this.propTpl.apply(sortedProps[k]);
                }
            }   
            return res;
          } catch (ex){
            lore.debug.ore("Error with template",ex);
          }
        }
    }
);
lore.ore.ui.detailsResTemplate = new Ext.XTemplate(  
    '<tpl for=".">',
    '<div id="s{uri}">',
        '<div style="line-height:0.5em;border-top: 1px solid rgb(220, 224, 225); margin-top: 0.5em;"></div>',
        '<table style="white-space:normal;width:100%;font-family:arial;padding-bottom:0.5em"><tr {[this.displayHighlightColor(values.properties)]}><td style="padding:4px;padding-top:6px;">',
        '<span style="font-size:130%;font-weight:bold">{title}<tpl if="!title">Untitled Resource</tpl></span></td>',
        '<td width="80"><a href="javascript:void(0);" title="Show in graphical editor" onclick="lore.ore.ui.graphicalEditor.showResource(\'{uri}\');"><img src="' + lore.constants.baseUrl + 'skin/icons/ore/layout_pencil.png" alt="View in graphical editor"></a>',
        '&nbsp;<a href="javascript:void(0);" title="Show in resource list" onclick="Ext.getCmp(\'remlistview\').showResource(\'{uri}\')"><img src="' + lore.constants.baseUrl + 'skin/icons/ore/table_edit.png"></a>',
        '&nbsp;<a href="javascript:void(0);" title="Show in slideshow view" onclick="Ext.getCmp(\'newss\').showResource(\'{uri}\');"><img src="' + lore.constants.baseUrl + 'skin/icons/ore/picture_empty.png" alt="View in slideshow view"></a>',
        '&nbsp;<a href="javascript:void(0);" title="Show in explore view" onclick="lore.ore.explorePanel.showInExploreView(\'{uri}\',\'{title}\',{representsCO});"><img src="' + lore.constants.baseUrl + 'skin/icons/ore/network.png" alt="View in explore view"></a>',
        '</td></tr></table>',
        '<tpl if="representsCO == true"><ul><li class="mimeicon oreicon" style="font-style:italic;padding-bottom:0.5em;"><a title="Open in LORE" href="javascript:void(0);" onclick="lore.ore.controller.loadCompoundObjectFromURL(\'{uri}\');">{uri}</a></li></ul></tpl>',
        '<tpl if="representsCO == false && representsAnno == true"><ul><li class="mimeicon annoicon" style="font-style:italic;padding-bottom:0.5em;"><a title="Show in browser" onclick="lore.util.launchTab(\'{uri}?danno_useStylesheet=\')" href="javascript:void(0);">{uri}</a></li></ul></tpl>',
        '<tpl if="representsCO == false && representsAnno == false && isPlaceholder == false"><ul><li class="mimeicon {[lore.ore.controller.lookupIcon(values.properties.getProperty(lore.constants.NAMESPACES["dc"]+"type",0) || values.properties.getProperty(lore.constants.NAMESPACES["dc"]+"format",0), values.properties.getProperty(lore.constants.NAMESPACES["dc"]+"type",0))]}" style="font-style:italic;padding-bottom:0.5em;"><a title="Show in browser" onclick="lore.util.launchTab(\'{uri}\')" href="javascript:void(0);">{uri}</a></li></ul></tpl>',
        '<tpl if="isPlaceholder == true"><div style="font-style:italic;padding-bottom:0.5em;">(placeholder)</div></tpl>',
        '<tpl for="properties">{[this.displayProperties(values)]}</tpl>',
    '</div>',
    '</tpl>',
    {
        propTpl: new Ext.XTemplate('<p style="padding-bottom:0.3em;"><span title="{id}" style="font-weight:bold">{[fm.capitalize(values.name)]}:&nbsp;&nbsp;</span>{value}</p>'),
        relTpl: new Ext.XTemplate('<p style="padding-bottom:0.3em;"><a href="javascript:void(0);" onclick="Ext.getCmp(\'remdetailsview\').scrollToResource(\'{value}\')"><span title="{id}" style="font-weight:bold">{[fm.capitalize(values.name)]}:&nbsp;&nbsp;</span></a><a href="javascript:void(0);" title="Show {url} in browser" onclick="lore.util.launchTab(\'{url}\')">{title}</a></p>'),
        pRelTpl: new Ext.XTemplate('<p style="padding-bottom:0.3em;"><a href="javascript:void(0);" onclick="Ext.getCmp(\'remdetailsview\').scrollToResource(\'{value}\')"><span title="{id}" style="font-weight:bold">{[fm.capitalize(values.name)]}:&nbsp;&nbsp;</span></a>{title}</p>'),
        /** Convenience function to get style for highlighting resources according to highlightColor property 
         *  @param {lore.ore.model.ResourceProperties} props 
         **/
        displayHighlightColor: function(props){
          var hc = props.getProperty(lore.constants.NAMESPACES["layout"]+"highlightColor");
          if (hc){ 
            return ' style="background-color:' + hc.value + ';"'; 
          }
        },
        /** Custom function to display properties because XTemplate doesn't support wildcard for iterating over object properties 
         *  @param {lore.ore.model.ResourceProperties} o
         */
        displayProperties: function(o){
          try{
            var ns = lore.constants.NAMESPACES;
            var dcterms = ns["dcterms"];
            var dc = ns["dc"];
            var skipProps = {};
            skipProps[dc+"title"]=true;
            skipProps[dc+"format"]=true;
            skipProps[ns["rdf"]+"type"]=true;
            var sortedProps = o.getSortedArray(skipProps);
            var res = "";
            for (var k = 0; k < sortedProps.length; k ++){
                var propArray = sortedProps[k];
                for (var i=0; i < propArray.length; i++){
                    var prop = propArray[i];
                    // don't include layout props
                    if(prop.prefix != "layout"){
                        // look up title for rels
                        if (prop.value.toString().match("^http://") == "http://") {
                            // property data for related resource: for looking up title etc
                            var propR = lore.ore.cache.getLoadedCompoundObject().getAggregatedResource(prop.value);
                            var displayVal = prop.value.toString();
                            if (prop.prefix == "dc" && prop.name == "subject"){
                                displayVal = lore.ore.controller.lookupTag(prop.value.toString());
                            }
                            if (propR) {
                                prop.title = propR.get('properties').getTitle() || displayVal;
                                prop.url = propR.get('representsAnno') ? prop.value + "?danno_useStylesheet=" : prop.value;
                            } else {
                                prop.title = displayVal;
                                prop.url = prop.value;
                            }
                            if (propR && propR.get('isPlaceholder')){
                                // we don't want a link for placeholder resources
                                res += this.pRelTpl.apply(prop);
                            } else {
                                res += this.relTpl.apply(prop);
                            }
                        } else {
                            res += this.propTpl.apply(prop);
                        }
                    }
                }
            }   
            return res;
          } catch (ex){
                lore.debug.ore("Error with template",ex);
          }
        }
    }
);

/**
 * @class lore.ore.ui.DetailsDataView Data view to render aggregated resources in Details view
 * @extends Ext.DataView
 */
/**
 * @class lore.ore.ui.DetailsDataView Displays the properties and relationships of every resource in the Resource Map in full (text format)
 * @extends Ext.DataView
 */
lore.ore.ui.DetailsDataView = Ext.extend(Ext.DataView, {
    initComponent : function(){
        Ext.apply(this, { 
            tpl :  lore.ore.ui.detailsResTemplate,
            loadingText: "Loading resource summaries...",
            singleSelect: true,
            autoScroll: false,
            itemSelector : "div.resourceSummary"
        });
        lore.ore.ui.DetailsDataView.superclass.initComponent.call(this,arguments); 
    }
    
});
Ext.reg('detailsdataview', lore.ore.ui.DetailsDataView);

