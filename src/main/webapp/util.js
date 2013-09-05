if (typeof lore !== "object"){
    var lore = {};   
}
if (typeof Components !== "undefined") {
    try{
        // Firefox, util is exported for code module
        var EXPORTED_SYMBOLS = ['util'];
        
        if (typeof constants === "undefined") {
            Components.utils["import"]("resource://lore/constants.js",lore);
        }
        if (typeof debug !== "object") {
            Components.utils["import"]("resource://lore/debug.js",lore);
        }
        if (typeof XPointerService === "undefined") {
            Components.utils["import"]("resource://lore/lib/nsXPointerService.js");
        }
    } catch (ex){
        // ignore to allow unit tests to pass when not run from extension
        var XPointerService = function(){
        }
    }
} else {
    // Google Chrome, use lore.util directly
    var XPointerService = function(){
        // FIXME: dummy - needs to be loaded prior
    }
}

/**
 * General utility functions for I/O, manipulating the DOM, selections etc 
 * @class lore.util
 * @singleton
 */
lore.util = {
    /**
     * @property lore.util.xps
     * @type XPointerService
     * Used for generating xpointers for annotations
     */
    m_xps : new XPointerService(),
    /**
     * Determine if an object is empty (has no properties)
     * @param {Object} ob The object to check
     * @return {Boolean} true if the object is equivalent to {}
     */
    isEmptyObject : function (ob){
        for(var i in ob){
            if(ob.hasOwnProperty(i)) {
                return false;
            }
        }
        return true;
    },
    
    
    ELFHash: function(str) {
     var hash = 0;
     var x    = 0;

      for(var i = 0; i < str.length; i++)
      {
         hash = (hash << 4) + str.charCodeAt(i);

         if((x = hash & 0xF0000000) != 0)
         {
            hash ^= (x >> 24);
         }
         hash &= ~x;
      }

      return hash;
   },
   
   /**
     * Make sure that characters that might cause sparql errors are encoded
     * @param {String} str
     * */
    preEncode : function (str) {
        return str.replace(/}/g,'%7D').replace(/{/g,'%7B').replace(/</g, '%3C').replace(/>/g, '%3E');    
    },
    
    /**
     * Trim whitespace from a string
     * @param {String} str
     */
    trim : function (str) {
        return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    },
    
    /**
     * Removes DOM node, but preserves its children by attaching them to the node's 
     * parent instead.
     * 
     * Taken from code snippet on http://stackoverflow.com/questions/170004/how-to-remove-only-the-parent-element-and-not-its-child-elements-in-javascript .
     * @param {Node} nodeToRemove The node to remove
     */
    removeNodePreserveChildren : function(nodeToRemove, win) {
      var fragment = win.document.createDocumentFragment();
      while(nodeToRemove.firstChild) {
        fragment.appendChild(nodeToRemove.firstChild);
      }
      if (nodeToRemove.parentNode){
        nodeToRemove.parentNode.insertBefore(fragment, nodeToRemove);
        nodeToRemove.parentNode.removeChild(nodeToRemove);
      }
    },
    
    /**
     * From dannotate.js: Return value of first child or default
     * @param {Node} node
     * @param {} defaultValue
     * @return {} value of first child of first node, or default value if provided
     */
    safeGetFirstChildValue : function(node, defaultValue)
    {
      return ((node.length > 0) && (node[0]) && node[0].firstChild) ?
               node[0].firstChild.nodeValue : defaultValue ? defaultValue : '';
    },
    
    /**
     * Scroll to an element within a window
     * @param {Element} theElement
     * @param {} theWindow
     */
    scrollToElement : function(theElement, theWindow){
    
      var selectedPosX = 0;
      var selectedPosY = 0;
                  
      while(theElement){
        selectedPosX += theElement.offsetLeft;
        selectedPosY += theElement.offsetTop;
        theElement = theElement.offsetParent;
      }
                                      
     theWindow.scrollTo(selectedPosX - 75,selectedPosY - 75);
    },
    
    /**
     * Launch a small window containing a URL
     * @param {} url The URL to launch
     * @param {} locbar Boolean: whether to show location bar
     * @param {} win The parent window
     */
    launchWindow : function(url, locbar, win) {
        var winOpts = 'chrome=no,height=650,width=800,top=200,left=250,resizable=yes,scrollbars=yes';
        if (locbar) {
            winOpts += ',location=1';
        }
        var newwindow=win.open(url,'view_resource',winOpts);
        newwindow.focus();
        
    },
    
    /**
     * Launch a URL in a new tab in the main browser (or focus existing tab if already open in browser)
     * Code from MDC code snippets page https://developer.mozilla.org/en/Code_snippets/Tabbed_browser
     * @param {Object} url The url to launch
     * @param {Object} win The window in which to open the tab
     */
    launchTab : function(url, win) {
    	if (win) {
    		win.open(url, '_blank');
    	} else {
    		window.open(url, '_blank');
    	}
    },
    /**
     * Format a date (long format)
     * @param {String} adate The date to format
     * @param {Object} dateObj Object that parses the date
     * @return {String} the formatted date
     */
    longDate : function ( adate, dateObj ) {
        if (adate instanceof Date){
            return adate.format("D, d M Y H:i:s \\G\\M\\T O");
        } else if (adate){
            var theDate = dateObj.parseDate(adate, 'c');
            if (theDate){
                return theDate.format("D, d M Y H:i:s \\G\\M\\T O");
            }
        }
    },
    /**
     * Format a date (short format)
     * @param {String} adate The date to format
     * @param {Object} dateObj Object that parses the date
     * @return {String}
     */
    shortDate : function (adate, dateObj ) {
        if (adate instanceof Date){
            return adate.format("d M Y H:i:s");
        } else if (adate){
            var theDate = dateObj.parseDate(adate, 'c');
            if (theDate){
                return theDate.format("d M Y H:i:s");
            }
        }
    },
    
    /**
     * Retrieve an instance of the nsiLocalFile interface, initializing it with the
     * path supplied if it is supplied.
     * @param {String} fileBase (optional) File path
     * @return {nsiLocalFile} file object
     */
    getFile: function (fileBase) {
    var file = Components.classes["@mozilla.org/file/local;1"]
    .createInstance(Components.interfaces.nsILocalFile);
            if ( fileBase)
            file.initWithPath(fileBase);
        return file;
    },
    
    /**
     * Prompts user to choose a file to save to (creating it if it does not exist)
     * The callback should expect a single arg: a function which actually performs the save, 
     * allowing contents to be generated asynchronously e.g. via XSLT transform.
     * The reason for the callback for this function is so that the content is only generated when required: 
     * the save as dialog can pop up quickly, without having to generate the contents first (or at all if the action is cancelled).
     * @param {} title
     * @param {} defExtension
     * @param {} callback 
     * @param {} win
     * @return {}
     */
    writeFileWithSaveAs: function (title, defExtension, callback, win) {
            var nsIFilePicker = Components.interfaces.nsIFilePicker;
            var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
            fp.defaultExtension = defExtension;
            if ("xml" == defExtension){
                fp.appendFilters(nsIFilePicker.filterXML); 
            } else if ("txt" == defExtension){
                fp.appendFilters(nsIFilePicker.filterText);  
            } else if ("docx" == defExtension) {
                fp.appendFilter("MS Word 2007 documents","*.docx");
            }
            fp.appendFilters(nsIFilePicker.filterAll);
            fp.init(win, title, nsIFilePicker.modeSave);
            var res = fp.show();
            if (res == nsIFilePicker.returnOK || res == nsIFilePicker.returnReplace) {
                callback(
                    // a function which performs the save
                    function(dataStr){
                        var thefile = fp.file;
                        var fostream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
                        fostream.init(thefile, 0x02 | 0x08 | 0x20, 0666, 0);
                        var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);
                        converter.init(fostream, "UTF-8", 0, 0);
                        converter.writeString(dataStr);
                        converter.close();
                        return {'fname': thefile.persistentDescriptor, 'data':dataStr};
                    }
                );
            }
            return null;
            
    },
    /** 
     * Saves content from a Data URI to a file - prompting user for location
     * @param {} title
     * @param {} defExtension
     * @param {} win
     * @param {} uri Data URI to save
     * @return {}
     */
    writeURIWithSaveAs: function(title, defExtension, win, uri){
    	//document.location.href = uri;
        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
        fp.defaultExtension = defExtension;
        fp.appendFilters(nsIFilePicker.filterAll); 
        fp.init(win, title, nsIFilePicker.modeSave);
        var res = fp.show();
        if (res == nsIFilePicker.returnOK || res == nsIFilePicker.returnReplace) {
            
            var thefile = fp.file;
            var io = Components.classes["@mozilla.org/network/io-service;1"]  
                 .getService(Components.interfaces.nsIIOService);  
            var source = io.newURI(uri, "UTF8", null);  
            var target = io.newFileURI(thefile) ; 
            var persist = Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"]  
                      .createInstance(Components.interfaces.nsIWebBrowserPersist);  

            persist.persistFlags = Components.interfaces.nsIWebBrowserPersist.PERSIST_FLAGS_REPLACE_EXISTING_FILES;  
            persist.persistFlags |= Components.interfaces.nsIWebBrowserPersist.PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION;
            persist.saveURI(source, null, null, null, null, thefile);  
            return {fname: thefile.persistentDescriptor};
        }
        return null;
    },
    /**
     * Prompts user to choose a file and loads that file
     * @param {} title
     * @param {} defExtension
     * @param {} win
     * @return {}
     */
    loadFileWithOpen: function(title, defExtension, win) {
         
         var nsIFilePicker = Components.interfaces.nsIFilePicker;
         var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
         fp.appendFilters(nsIFilePicker.filterXML);
         fp.appendFilter(defExtension.desc, defExtension.filter);
         fp.init(win, title , nsIFilePicker.modeOpen);
         
         var res = fp.show();
         
         if (res == nsIFilePicker.returnOK){
            var thefile = fp.file;
            var data = "";
            var fistream = Components.classes["@mozilla.org/network/file-input-stream;1"].
                        createInstance(Components.interfaces.nsIFileInputStream);
            var cstream = Components.classes["@mozilla.org/intl/converter-input-stream;1"].
                        createInstance(Components.interfaces.nsIConverterInputStream);
            fistream.init(thefile, -1, 0, 0);
            cstream.init(fistream, "UTF-8", 0, 0); 
            var str = {};
            while(cstream.readString(4096,str) != 0){
                data += str.value;
            }
            cstream.close();
            return {fname: thefile.persistentDescriptor, data:data};
        }
        return null;
    },
    
    /**
     * Remove any artifacts from the XPath
     * @param {} xp
     */
    normalizeXPointer : function(xp) {
        if (typeof(xp) == 'string') {
            var idx = xp.indexOf('#');
            return xp.substring(idx + 1);
        }
    
        for ( var i =0; i < xp.length;i++) {
            xp[i] = xp[i] + '';
            xp[i] = xp[i].substring(xp[i].indexOf("#")+1);
        }
    
        return xp;
    },
    /**
     * Inject contents of local stylesheet into document
     * @param {} chromefile
     * @param {} win
     */
    injectCSS : function ( chromefile, win, callingwin) {
        var doc = win.document;
        var url = "resource://lore/" + chromefile;
        var xhr = new callingwin.XMLHttpRequest();
        
        xhr.open("GET", url);
        xhr.overrideMimeType('text/css');
        xhr.onreadystatechange = function(){
            if (xhr.readyState == 4) {
                try {
                    // status is probably 0 because it is loaded from chrome url,
                    // but assume it was ok if there is a response
                    var content = xhr.responseText;
                    if (content){
                        var style = doc.createElement("style");
                        style.setAttribute("type","text/css");
                        style.textContent = content;
                        doc.getElementsByTagName("head")[0].appendChild(style);
                    }
                } catch (e){
                    debug.ui("Error: Unable to inject CSS",e);
                }
            }
        }
        xhr.send(null); 
         
    },
    
    /**
     * Generate random colour and return as hex string
     * If one or more arguments aren't supplied min fields wil default to 0
     * and max fields will default to 255
     * @param {Object} mr min red
     * @param {Object} mg min green
     * @param {Object} mb min blue
     * @param {Object} mxr max red
     * @param {Object} mxg max green
     * @param {Object} mxb max blue
     */
    generateColour : function(mr,mg,mb,mxr, mxg, mxb) {
        var min = new Array( (mr ? mr: 0), (mg ? mg: 0), (mb ? mb: 0) );
        var max = new Array( (mxr ? mxr: 255), (mxg ? mxg: 255), (mxb ? mxb: 255) );
        
        var rgb = new Array(3);
        for (var i = 0; i < rgb.length; i++) {
            rgb[i] = Math.round(Math.random() * (max[i] - min[i])) + min[i];
        }
        var colour = rgb[0] + ( rgb[1] << 8) + (rgb[2] << 16);
        return "#" + colour.toString(16);
    },
    
    /**
     * Disect the range into multiple ranges IF a selection passes it's containing DOM 
     * element's DOM boundary  
     * @param {} targetDocument
     * @param {} r
     * @param {} nodeTmpl
     * @return {}
     */
    safeSurroundContents: function(targetDocument, r, nodeTmpl) {
        var nodes = [];
            
        if ( r.startContainer.parentNode == r.endContainer.parentNode ) {
            // doesn't cross parent element boundary
            var n = nodeTmpl.cloneNode(false);
            r.surroundContents(n);
            
            return [n];
        } 
        var s = r.startContainer;
        var e = r.endContainer;

        // create inital range to end of the start Container
        // set end offset to end of contents of start node
        // i.e <div> This [is </div> <p> a lot of </p><p>highli]ghting</p>
        // inital range is 'is ' out the selection ( '[' and ']' denote highlighted region)
        var w = targetDocument.createRange();
        
        w.selectNodeContents(s);
        w.setStart(r.startContainer,r.startOffset);
        //debug.ui("start range: " + w, w);
        var n = nodeTmpl.cloneNode(false);
        w.surroundContents(n);
        nodes.push(n);
        
        var container = s.nodeType !=1 ?  n: s;
        // loop through DOM nodes thats are completely selected 
        // i.e 'a lot of ' range selection would be created from the example
        var containsEl = function(src, dest) {
            if ( src == dest) {
                return true;
            }
            
            if (src.nodeType == 1) {
                for (var i = 0; i < src.childNodes.length; i++) {
                    if (containsEl(src.childNodes[i], dest)) {
                        return true;
                    }
                }
            }
            return false;
        };
        
        var tag = function(container) {
            var nt = container.nodeType;
            var ignore = {};
            if ( nt == 1 ) {
                for (var i = 0; i < container.childNodes.length; i++) {
                    var n = container.childNodes[i];
                    if (!n.id || (n.id && !ignore[n.id])) {
                        n = tag(container.childNodes[i]);
                        if ( n) ignore[n.id] = n;
                    }
                }
            } else if ( (nt == 3 || nt ==4 || nt == 8) && lore.util.trim(container.nodeValue) != '') {
                var w = targetDocument.createRange();
                w.selectNodeContents(container);
                //debug.ui("tagging : " + w , w);
                var n = nodeTmpl.cloneNode(false);
                w.surroundContents(n);
                n.id = debug.hcounter|| 0;
                debug.hcounter = debug.hcounter ? debug.hcounter+1:1;
                                
                nodes.push(n);
                return n;
            }
        };
        
        // move up the DOM tree until find parent node
        // that contains the end container  
        var found = false;
        while ( !found ) {
            while (!container.nextSibling ) {
                    //debug.ui('p');
                    container = container.parentNode;
                    if (!container)
                        break;
            }
            if (!container)
                break;
            //debug.ui('s');    
            container = container.nextSibling;
            
            if ( containsEl(container, e)) {
                found = true;
            }
            else {
                tag(container);
            }
        }
        // traverse down to end container
        container = container.nodeType == 1 ? container.firstChild : container;
        
        while ( container != e ) {
            if ( containsEl(container, e) ){
                container = container.firstChild;
            } else {
                tag(container);
                container = container.nextSibling;
            }
        }
        
        // create range for end container
        // i.e 'highli' from example
        w = targetDocument.createRange();
        w.selectNodeContents(e);
        w.setEnd(r.endContainer, r.endOffset);
        //debug.ui("end range: " + w, w);
        n = nodeTmpl.cloneNode(false);
        w.surroundContents(n);
        nodes.push(n);
        //debug.ui("end");
        
        return nodes;
    },

        
     /**
     * Highlight part of a document
     * @param {} sel Context to highlight (as DOM Range)
     * @param {} targetDocument The document in which to highlight
     * @param {} colour highlight colour
     */
    highlightRange : function (sel, targetDocument, styleCallback) {
        try {
            var highlightNodeTmpl = targetDocument.createElementNS(lore.constants.NAMESPACES["xhtml"], "span");
            if (styleCallback)
                styleCallback(highlightNodeTmpl);
            
            var highlightNodes =  lore.util.safeSurroundContents(targetDocument, sel, highlightNodeTmpl);
            for ( var i =0; i< highlightNodes.length;i++) {
                lore.util.ignoreElementForXP(highlightNodes[i]);
            }
            
            return highlightNodes;
        } catch (e) {
            lore.debug.ui("Error in highlightRange",e);
            return null;
        }
    },
    
    /**
     * Mark element to be ignored when xpointer library is searching through dom during node resolution
     * @param {Object} domNode
     */
    ignoreElementForXP : function ( domNode ) {
        lore.util.m_xps.markElement(domNode);
    },  
    
    /**
     * Return the window object of the content window
     */
    getContentWindow : function(win) {
        return win.top.getBrowser().selectedBrowser.contentWindow;
    },
    /**
     * Get the Range defined by an XPath/Xpointer (restricted to subset of
     * expressions understood by Anozilla).
     * modified from dannotate.js
     */
    getSelectionForXPath : function(xp, targetDocument)
    {
        return lore.util.m_xps.xptrResolver.resolveXPointerToRange(xp, targetDocument);
    },
    /**
     * @param {} xp
     * @param {} win
     * @return {}
     */
    getNodeForXPath : function(xp, targetDocument) {
        //return targetDocument.evaluate( xp, targetDocument, null, win.XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue;
        if ( xp.indexOf("#") != -1)
            xp = xp.substring(xp.indexOf("#")+1);
        
        return targetDocument.evaluate( xp, targetDocument, null, 0, null ).iterateNext();
    },
    
    /**
     * Currently only works for an xpointer containing only an xpath,
     * not for image-range or string-range xpointers
     * @param {} xp
     * @return {}
     */
    getXPathFromXPointer : function(xp) {
        xp = lore.util.normalizeXPointer(xp);
        lore.debug.ui("xpointer is ",xp);
        var start = xp.indexOf('(') + 1,
            end = xp.lastIndexOf(')');
        return xp.substring(start, end);
    },
    
    /**
     * 
     * @param {} xp
     * @param {} targetDocument
     * @return {}
     */
    getNodeForXPointer: function(xp, targetDocument) {
        if ( xp.indexOf("#") != -1)
            xp = xp.substring(xp.indexOf("#")+1);
        return lore.util.m_xps.parseXPointerToNode(xp, targetDocument);
    },
    
    /**
     * This fn depends on a hacked version of nsXpointerService being loaded by the browser
     * before this script is loaded from tags in the page being annotated.
     * modified from dannotate.js
     * @return XPath/XPointer statement for selected text, or '' if no selection.
     */
    
    getXPathForSelection : function(win)
    {
      var mainwindow = lore.util.getContentWindow(win);
      var xp = '';
      try {
        var seln = mainwindow.getSelection();
        
        if (seln && seln!='') {
          var select = seln.getRangeAt(0);
          xp = lore.util.m_xps.xptrCreator.createXPointerFromSelection(seln, mainwindow.document);
        }
      }
      catch (ex) {
        throw new Error('XPath create failed\n' + ex.toString());
      }
      return xp;
    },
    /**
     * Return an XPath for an image
     */
    getXPathForImageSelection : function (domNode, doc, coords, noScale ) {
            var scale = noScale ? {x:1,y:1}: lore.util.getImageScaleFactor( domNode, doc);
            var x1 = parseInt(coords.x1 * scale.x), y1 = parseInt(coords.y1 * scale.y), 
                x2 = parseInt(coords.x2 * scale.x), y2 = parseInt(coords.y2 * scale.y);
            
            var xp = ("xpointer(image-range(" + lore.util.m_xps.xptrCreator.create_child_XPointer(domNode)
            + ",[" + x1 + "," + y1 + "],[" + x2 + "," + y2 + "],\"" + domNode.src + "\"))");
             
            lore.debug.ui("The image region Xpointer is: " + xp);
            return xp;  
    },
    
      
    /**
     * Return an object with a hash of the provided triple, and an xpointer to it's current location
     * @param {} triple
     * @return {}
     */
    getMetaSelection: function(triple) {
        var sel = {};
        
        if (!triple.source) {
            lore.debug.ui ( "Couldn't find dom context", triple);
            return sel;
        }
        
        try {
            sel.xp = "xpointer(" + lore.util.m_xps.xptrCreator.create_child_XPointer(triple.source) + ")"; 
        } catch (e) {
            lore.debug.anno("Error occurred generating xpointer for tirple:  " +e, e);
        }
        return sel;
    },

    
    /**
     * Find the type of an xpointer, either 'image-range', 'string-range',
     * or 'plain'
     * @param {} xp
     * @return {String}
     */
    getXPointerType: function(xp) {
        if (xp.indexOf("image-range") != -1) {
            return "image-range";
        } else if (xp.indexOf("string-range") != -1) {
            return "string-range";
        } else {
            return "plain";
        }
    },
    
    /**
     * Checks if xpointer contains an image range
     * @param {} xp The xpointer to check
     * @return {Boolean} True if xp contains an image range
     */
    isXPointerImageRange: function (xp) {
        return xp.indexOf("image-range") != -1;
    },
    
    /**
     * Decode an image-range xpointer into it's component parts
     */
    decodeImageRangeXPointer: function(xpointer) {
        if (!lore.util.isXPointerImageRange(xpointer) )
            return null;
        
        xpointer = lore.util.normalizeXPointer(xpointer);
        var xpBits = xpointer.substring("xpointer(image-range(".length ).split(',');
        var xp =  xpBits[0];
    
        // co-ordinates
        var x1 = parseInt(xpBits[1].substring(1)),
            y1 = parseInt(xpBits[2].substring(0,xpBits[2].length-1)),
            x2 = parseInt(xpBits[3].substring(1)),
            y2 = parseInt(xpBits[4].substring(0,xpBits[4].length-1));
        var coords = {x1: x1, y1:y1, x2:x2, y2:y2};
        
        var imgUrl = xpBits[5].replace(/\"\)\).*/g, '').replace(/\"/, '');      
        
        return {xp:xp, coords: coords, imgUrl:imgUrl};
    },
    
    /**
     * Parse and resolve in the document an iamge-range xpointer
     * @param {} xpointer
     * @param {} targetDocument
     * @return {}
     */
    parseImageRangeXPointer: function (xpointer, targetDocument) {
        if (!lore.util.isXPointerImageRange(xpointer))
            return null;
        
        var decoded = this.decodeImageRangeXPointer(xpointer);
        
        if (targetDocument)
            decoded.image = lore.util.getNodeForXPath(decoded.xp, targetDocument);
    
        return decoded;
    },
    
    /**
     * Temporarily load another copy of an image an determine if the version
     * visible on the page has been scaled (implicitly or explicitly)
     * @param img The IMG element to test
     */
    getImageScaleFactor: function  (img, doc)
    {
        // stripped from dannotate.js
        //var doc = img.ownerDocument;
        var iwidth = parseInt(img.offsetWidth);
        var iheight = parseInt(img.offsetHeight);
        var tmpNode = doc.createElement('img');
        tmpNode.setAttribute('src', img.src);
        tmpNode.style.visibility = 'hidden';
        doc.body.appendChild(tmpNode);
        
        var twidth = parseInt(tmpNode.offsetWidth);
        var theight = parseInt(tmpNode.offsetHeight);
        doc.body.removeChild(tmpNode);
        
        var xScaleFac = twidth/iwidth;
        var yScaleFac = theight/iheight;
        return { x: xScaleFac, y: yScaleFac, imgWidth:iwidth, imgHeight:iheight, origWidth:twidth,origHeight:theight};
    },
                
    /**
     * Return the text contents of a selection
     * @param {} currentCtxt
     * @return {} The selection contents
     */
    getSelectionText : function(currentCtxt, targetDocument){
        var selText = "";
        if (currentCtxt){
            if (lore.util.isXPointerImageRange(currentCtxt)){
                
                var data = lore.util.parseImageRangeXPointer(currentCtxt, targetDocument);
                var c = data.coords;
                return 'Image region (' + c.x1 + ', ' + c.y1 +')-(' + c.x2 +', ' + c.y2 +') selected from ' + data.image.src;               
            }
            var idx = currentCtxt.indexOf('#');
            var sel = lore.util.getSelectionForXPath(currentCtxt.substring(idx + 1), targetDocument);
            selText = sel.toString();
            if (selText){
                if (selText.length > 100){
                    selText = selText.substring(0,100) + "...";
                }
            }
        }
        return selText;
    },
    /**
     * Split a URL identifier into namespace and term
     * @param {String} theurl The URL identifier to split
     * @return {Object} A JSON object with properties ns (the namespace) and term
     *         (the unqualified term)
     */
    splitTerm : function(theurl) {
        var result = {};
        // try splitting on #
        var termsplit = theurl.split("#");
        if (termsplit.length > 1) {
            result.ns = (termsplit[0] + "#");
            result.term = termsplit[1];
        } else {
            // split after last slash
            var lastSlash = theurl.lastIndexOf('/');
            result.ns = theurl.substring(0, lastSlash + 1);
            result.term = theurl.substring(lastSlash + 1);
        }
        return result;
    },
    /**
     * @param {} tree
     * @param {} attribute
     * @param {} value
     * @return {}
     */
    findChildRecursively : function(tree,attribute, value) {
        var cs = tree.childNodes;
        var found;
        for(var i = 0, len = cs.length; i < len; i++) {
            if(cs[i].attributes[attribute] == value){
                return cs[i];
            }
            else {
                // Find it in this tree
                if(found = lore.util.findChildRecursively(cs[i], attribute, value)) {
                    return found;
                }
            }
        }
        return null;
    },
    /**
     * @param {} store
     * @param {} xid
     * @return {}
     */
    findRecordById : function(store, xid) {
        var ind = store.findBy(function(rec, id){
                if ( !xid ) {
                    return !rec.id;
                } else  if (rec.id == xid) {
                    return true;
                }
            });
        if (ind != -1) {
            return store.getAt(ind);
        } else {
            return null;
        }
    },
    
    /**
     * Escape characters for HTML display
     * @return {}
     */
    escapeHTML : function (str) {                                       
            return(                                                                 
                str.replace(/&/g,'&amp;').                                         
                    replace(/>/g,'&gt;').                                           
                    replace(/</g,'&lt;').                                           
                    replace(/"/g,'&quot;').
                    replace(/'/g,'&apos;')                                         
            );                                                                     
    },
    /**
     * Unescape HTML entities to characters
     * @return {}
     */
    unescapeHTML : function (str){
        return(                                                                 
                str.replace(/&amp;/g,'&').                                         
                    replace(/&gt;/g,'>').                                           
                    replace(/&lt;/g,'<').                                           
                    replace(/&quot;/g,'"').
                    replace(/&apos;/g,'\'') 
            );    
    },
    escapeQuotes : function (str) {
    	return str.replace(/"/g, '\\"')//.replace(/\\/g, "\\\\");
    },
    /**
     * Creates a XUL iframe that has javascript and embedded objects disabled. 
     * @param iframe DOM element 
     * @param theurl URL to load
     * @param exOnLoad callback function
     
     */
    
    createXULIFrame : function(win) {
        var iframe = win.top.document.createElement("iframe"); // create a XUL iframe 
        iframe.setAttribute("type", "content-targetable");
        iframe.setAttribute("collapsed", true);
        iframe.style.visibility = "visible";
        iframe.setAttribute("transparent", true);
        // click opens the resource in the main browser
        iframe.addEventListener("click",function(e){
            try{
                lore.util.launchTab(this.getAttribute('src').replace('&printPreview=y',''),this.contentWindow);
            } catch (ex){
                lore.debug.ui("Error in iframe onclick",ex);
            }
        },false);
        return iframe;
    },
    /**
     * @param {} iframe
     * @param {} theurl
     */
    setSecureXULIFrameContent : function(iframe, theurl) {
        // once the document had loaded the iframe
        // the docshell object will be created.
        // dochsell must be set before loading the page
        // so reload the page
        //iframe.docShell.allowAuth = false;
        
        // As the pages are being loaded in XUL content iframes, it should be ok to allow Javascript
        //iframe.docShell.allowJavascript = false;
        
        //iframe.docShell.allowMetaRedirects = false;
        //iframe.docShell.allowPlugins = false;
        iframe.setAttribute("src",theurl);
        iframe.addEventListener("load", lore.util.insertSecureFrameStyle, true, true);        
    },
    /**
     * @param {} win
     * @param {} theurl
     * @param {} extraFunc
     * @return {}
     */
    createSecureIFrame : function(win, theurl, extraFunc) {
        var iframe = lore.util.createXULIFrame(win);
        iframe.addEventListener("load", function onLoadTrigger (event) {
	            iframe.removeEventListener("load", onLoadTrigger, true);
	            lore.util.setSecureXULIFrameContent(iframe, theurl);
	            if ( extraFunc) {
	                extraFunc();
	            }
            }, true);
        // trigger onload
        iframe.setAttribute("src", "data:text/html,%3Chtml%3E%3Cbody%3ELoading...%3C/body%3E%3C/html%3E");
        return iframe;
    },
    /** 
     * Insert stylesheet to style site previews (sandboxed iframes) 
     * @param {Object} ev The onload event 
     * */
    insertSecureFrameStyle: function(ev) {
        try{
            var doc = this.contentDocument;
            var theCSS = '.flash-player, noembed, .media-player, object, embed {border: 3px solid #cc0000; padding: 4px;}' 
                + '.flash-player:before, noembed:before, .media-player:before, object:before, embed:before {font-size: 10px; font-family; Arial, sans-serif; color: #cc0000; content: \"Plugins are disabled in LORE previews. Please open resource in main browser window to view Flash or other embedded content.\" !important; } '
                + 'object[classid*=":D27CDB6E-AE6D-11cf-96B8-444553540000"],object[codebase*="swflash.cab"],object[data*=".swf"],object[type="application/x-shockwave-flash"],object[src*=".swf"],embed[type="application/x-shockwave-flash"],embed[src*=".swf"],embed[allowscriptaccess],embed[flashvars],embed[wmode]'
                + '{display:none !important;}';
            if (doc){
                var styleElem = doc.createElement("style");
                styleElem.type = "text/css";
                styleElem.textContent = theCSS;
                var head = doc.getElementsByTagName("head")[0];
                if (head){
                    head.appendChild(styleElem); 
                }
            }
        } catch (e){
            lore.debug.ui("Error in lore.util.insertSecureFrameStyle:",e)
        }
    },
    parseHTMLToElement : function(html,win){
        var fragment = Components.classes["@mozilla.org/feed-unescapehtml;1"]  
                .getService(Components.interfaces.nsIScriptableUnescapeHTML)  
                .parseFragment(html, false, null, win.document.body);
        var div = win.document.createElement("div");
        if (fragment){
            div.appendChild(fragment);
        }
        return div;    
    },
    htmlToDom : function(html, win){
            var fragment = Components.classes["@mozilla.org/feed-unescapehtml;1"]  
                .getService(Components.interfaces.nsIScriptableUnescapeHTML)  
                .parseFragment(html, false, null, win.document.body);
            
            return fragment;
    },
    /** Remove any markup from the provided value */
    stripHTML : function(val, doc){
    	return val;
        /*if (typeof Components != "undefined") {
	        var fragment = Components.classes["@mozilla.org/feed-unescapehtml;1"]  
	                .getService(Components.interfaces.nsIScriptableUnescapeHTML)  
	                .parseFragment(val, false, null, doc.body);
	        var serializedContent = "";
	        if (fragment){
	            var divEl = doc.getElementById('sanitize');
	            if (!divEl){
	                divEl = doc.createElement("div");
	                divEl.setAttribute("id", "sanitize");
	                divEl.style.display = "none";
	            }
	            divEl.appendChild(fragment);
	            // read textContent to strip out markup
	            serializedContent = divEl.textContent;
	            divEl.removeChild(divEl.firstChild);
	        }
	        lore.debug.ui("stripped", serializedContent);
	        return serializedContent;
    	} else {
    		return val;
    	}*/
    },
    /**
     * Basic HTML Sanitizer using Firefox's parseFragment
     * @param {Object} html
     */
    sanitizeHTML : function(html, win, asHTML) {        
        html = html.replace(/<br>$/,'');
        // parseFragment sanitizes html content
        /*if (typeof Components != 'undefined') {
	        var fragment = Components.classes["@mozilla.org/feed-unescapehtml;1"]  
	            .getService(Components.interfaces.nsIScriptableUnescapeHTML)  
	            .parseFragment(html, false, null, win.document.body);
	        if (fragment) {
	            if (asHTML){ 
	                // use a temporary element to serialize sanitized fragment to plain HTML
	                var doc = win.document;
	                var divEl = doc.getElementById('sanitize');
	                if (!divEl){
	                    divEl = doc.createElement("div");
	                    divEl.setAttribute("id","sanitize");
	                    divEl.style.display = "none";
	                }
	                divEl.appendChild(fragment);
	                // read inner HTML to serialize to HTML : used for annotations
	                var serializedContent = divEl.innerHTML;
	                divEl.removeChild(divEl.firstChild);
	                return serializedContent;
	            } else {
	                var serializer = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"]
	                	.createInstance(Components.interfaces.nsIDOMSerializer); 
	                
	                // use XML Serializer to serialize fragment to XML
	                var buf = serializer.serializeToString(fragment);
	                // remove garbage
	    */
	    //          return buf.replace(/[\x80-\xff|\u0080-\uFFFF]*/g, '');
        /*
	            }
	        }
        } */
        return html;
    },
    /**
     * Add target="_blank" to all links in an html string
     * @param {Object} html
     */
    externalizeLinks : function(html){
        return html.replace(/<A /gi,'<A target="_blank" '); 
    },
    /**
     * @name lore.util.externalizeDomLinks
     * @param {} node
     */
    externalizeDomLinks : function(node){
        var links = node.getElementsByTagName('a');
        var attr;
        for (var i=0; i < links.length; i++){
            links[i].setAttribute("target","_blank");
        }
    },
    /**
     * normalize spaces in a string
     * @return {}
     */
    normalize : function(str) {
        return str.replace(/^\s*|\s(?=\s)|\s*$/g, "");
    },
    setHighContrast: function(win, activate) {
         var link;
         for (var i = 0; (link = win.document.getElementsByTagName("link")[i]); i++)
         {
           var t = link.getAttribute("title");
           if (link.getAttribute("rel").indexOf("style") != -1 && t)
           {
              var isHC = (t == 'highContrastExt' || t == 'highContrast' || t == 'highContrastUI');
              if (isHC && activate) {
                 link.disabled = false;
              } else if (isHC && !activate) {
                 link.disabled = true;
              }
           }
         }
    },
    /**
     * Transform XML to a presentation format using an XSLT stylesheet
     * @param {} args
     */
    transformXML: function(args) {
            var stylesheetURL = args.stylesheetURL;
            var theXML = args.theXML;
            var win = args.window;
            var serialize = args.serialize; // whether or not to serialize before calling callback
            var callback = args.callback;
            var params = args.params; // params to pass to XSLT stylesheet
            
            var xsltproc = new win.XSLTProcessor();
            // get the stylesheet - this has to be an XMLHttpRequest because Ext.Ajax.request fails on chrome urls
            var xhr = new win.XMLHttpRequest();
            xhr.overrideMimeType('text/xml');
            xhr.open("GET", stylesheetURL);
            xhr.onreadystatechange = function(){
                if (xhr.readyState == 4) {
                    try{
                        var stylesheetDoc = xhr.responseXML;
                        // status is likely to be 0 because it is loaded from chrome URL
                        // assume request was ok if there is a response
                        if (stylesheetDoc){
                            xsltproc.importStylesheet(stylesheetDoc);
                            for (param in params){
                                xsltproc.setParameter(null,param,params[param]);
                            }
                            xsltproc.setParameter(null, "indent", "yes");
                            var parser = new win.DOMParser();
                            var doc = parser.parseFromString(theXML, "text/xml");
                            var resultFrag = xsltproc.transformToFragment(doc, win.document);
                            var serializer = new win.XMLSerializer();
                            if (serialize){
                                var result = serializer.serializeToString(resultFrag);
                                callback(result);
                            } else {
                                callback(resultFrag);
                            }
                        }
                    } catch (e){
                        lore.debug.ui("Error transforming XML",e);
                        return "";
                    }
                }
            };
            xhr.send(null);
    },
    copyToClip : function(aString){
        var gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].  
            getService(Components.interfaces.nsIClipboardHelper);  
        gClipboardHelper.copyString(aString);
    },
    
    /**
     * Encodes a string to a format ready for passing as a parameter to a request.
     * This includes double encoding special URI characters {}|\\^~[]`
     * @param {} str
     * @return {}
     */
    fixedEncodeURIComponent : function(str) {
        /* Unsafe characters from rfc1738, not include tilde ~
         * for some reason, tilde isn't encoded by the built in function.
         */
        var badchars = "{}|\\^[]`".split('');
        var uri = encodeURIComponent(str);
        for (var i = 0; i < badchars.length; i++) {
            var once = encodeURIComponent(badchars[i]);
            var twice = encodeURIComponent(once);
            uri = uri.replace(new RegExp(once, 'g'), twice);
        }
        return uri;
        //encodeURIComponent(str).replace(/%5B/ig, '%255B').replace(/%5D/ig, '%255D');
    },
    /** Make a nsIURI object from a string URI */
    makeURI: function(aURL, aOriginCharset, aBaseURI) {  
        var ioService = Components.classes["@mozilla.org/network/io-service;1"]  
                            .getService(Components.interfaces.nsIIOService);  
        var uri = ioService.newURI(aURL, aOriginCharset, aBaseURI);
        return uri.QueryInterface(Components.interfaces.nsIURL);
    },
    expandXML: function (e) {
        try{
            var parent = e.parentNode.parentNode;
            if (parent.className != 'expander-closed') {
                parent.className = 'expander-closed';
                e.className = 'expander-display-closed';
            } else {
               parent.className = '';
                e.className = 'expander-display-open';
            }
        } catch(ex){
            lore.debug.ui("Error in expandXML",ex);
        }
    },
    /** Normalize character encoding to uppercase in URL (specifically to deal with AustLit urls ) */
    normalizeUrlEncoding: function(url) {
        return url; // FIXME
        if (url){
            var thesplit = url.toString().split('%');
            var newurl = thesplit[0];
            if (thesplit.length > 1){
                for (var j = 1; j < thesplit.length; j++){
                    var str = thesplit[j];
                    newurl += "%" + str.substr(0,2).toUpperCase() + str.substr(2);
                }
            }
            lore.debug.ui("normalizeUrlEncoding " + newurl);
            return newurl;
        }
    },
    urlsAreSame : function(url1, url2) {
        if (url1 && url2){
            var url1r = url1.replace(/\#.*$/,'');
            var url2r = url2.replace(/\#.*$/,'');
            return decodeURIComponent(url1r) === decodeURIComponent(url2r);
        }
    },
    /**
     * Convert chrome:// uri to file (from developer.mozilla.org code snippets)
     * @param {} aPath
     */
    chromeToPath : function (aPath) {
       if (!aPath || !(/^chrome:/.test(aPath)))
          return; //not a chrome url
       var rv;
       
          var ios = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces["nsIIOService"]);
            var uri = ios.newURI(aPath, "UTF-8", null);
            var cr = Components.classes['@mozilla.org/chrome/chrome-registry;1'].getService(Components.interfaces["nsIChromeRegistry"]);
            rv = cr.convertChromeURL(uri).spec;
            if (/^file:/.test(rv)) 
              rv = this.urlToPath(rv);
            else
              rv = this.urlToPath("file://"+rv);
          return rv;
    },
    /**
     * Convert url to path, used by chromeToPath (from developer.mozilla.org code snippets)
     * @param {} aPath
     */
    urlToPath: function (aPath) {
        if (!aPath || !/^file:/.test(aPath))
          return ;
        var rv;
       var ph = Components.classes["@mozilla.org/network/protocol;1?name=file"]
            .createInstance(Components.interfaces.nsIFileProtocolHandler);
        rv = ph.getFileFromURLSpec(aPath).path;
        return rv;
    },
/*
From Math.uuid.js 1.3
Math.uuid.js is Copyright (c) 2008, Robert Kieffer
All rights reserved.
Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
    * Neither the name of Robert Kieffer nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/**
 * Generate a random uuid.
 *  
 * <pre>USAGE: uuid(length, radix)
 * EXAMPLES:
 *   // No arguments  - returns RFC4122, version 4 ID
 *   >>> uuid()
 *   "92329D39-6F5C-4520-ABFC-AAB64544E172"
 * 
 *   // One argument - returns ID of the specified length
 *   >>> uuid(15)     // 15 character ID (default base=62)
 *   "VcydxgltxrVZSTV"
 *
 *   // Two arguments - returns ID of the specified length, and radix. (Radix must be <= 62)
 *   >>> uuid(8, 2)  // 8 character ID (base=2)
 *   "01001010"
 *   >>> uuid(8, 10) // 8 character ID (base=10)
 *   "47473046"
 *   >>> uuid(8, 16) // 8 character ID (base=16)
 *   "098F4D35"
 *   </pre>
 *  @param {int} length - the desired number of characters
 *  @param {int} radix  - the number of allowable values for each character.
 */
  uuid : (function() {
      // Private array of chars to use
      var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''); 
    
      return function (len, radix) {
        var chars = CHARS;
        var u = []
        var rnd = Math.random;
        radix = radix || chars.length;
    
        if (len) {
          // Compact form
          for (var i = 0; i < len; i++) u[i] = chars[0 | rnd()*radix];
        } else {
          // rfc4122, version 4 form
          var r;
    
          // rfc4122 requires these characters
          u[8] = u[13] = u[18] = u[23] = '-';
          u[14] = '4';
    
          // Fill in random data.  At i==19 set the high bits of clock sequence as
          // per rfc4122, sec. 4.1.5
          for (var i = 0; i < 36; i++) {
            if (!u[i]) {
              r = 0 | rnd()*16;
              u[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r & 0xf];
            }
          }
        }
    
        return u.join('');
      };
    })()

};
if (typeof Components !== "undefined"){
    // For Firefox code modules
    util = lore.util;
}