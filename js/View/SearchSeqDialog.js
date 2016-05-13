define([
    'dojo/_base/lang',
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dojo/aspect',
    'dijit/Dialog',
    'dijit/focus',
    'dijit/form/Button',
    'dijit/form/RadioButton',
    'dijit/form/CheckBox',
    'dijit/form/TextBox',
    'dijit/form/SimpleTextarea',
    'dijit/form/NumberTextBox',
    'dijit/form/Select',
	'dojox/grid/DataGrid', 
	'dojo/data/ItemFileWriteStore', 
	'JBrowse/View/Dialog/WithActionBar',
    './QuickHelp',
    'dojo/domReady!'
    ],

function (
lang,
declare,
dom,
aspect,
dijitDialog,
focus,
dButton,
dRButton,
dCheckBox,
dTextBox,
dTextarea,
dNumberBox,
dSelect,
DataGrid,
ItemFileWriteStore,
ActionBarDialog,
HelpDialog) {

    return declare(ActionBarDialog, {

        constructor: function () {
            var thisB = this;
            aspect.after(this, 'hide', function () {
                focus.curNode && focus.curNode.blur();
                setTimeout(function () {
                    thisB.destroyRecursive();
                }, 500);
            });
        },

        _dialogContent: function () {

			console.log(document.location.search);

            var content = this.content = {};
			var dataRoot = this.dataRoot;
            var container = dom.create('div', {
                className: 'search-dialog'
            });

            var introdiv = dom.create('div', {
                className: 'search-dialog intro',
                innerHTML: 'This tool creates tracks showing regions of the reference sequence (or its translations) that match a given DNA or amino acid sequence.'
            }, container);

            // Render text box
            var searchInfoDiv = dom.create('div', {
                className: "meta-section"
            }, container);

            var searchToolDiv = dom.create('div', {
                className: "section"
            }, searchInfoDiv);

            var searchSpan = dom.create('span', {
                innerHTML: "Search tool: "
            }, searchToolDiv);

            content.searchBoxSelect = new dSelect({
                id: "searchBoxSelect"
            }).placeAt(searchToolDiv);
			
            var populateSearchBox = function () {
                
				var ok = false;
                var operation = "populate_search_box";
                dojo.xhrPost({
               
                    postData: 'dataRoot='+dataRoot+'&operation=get_tools',
                    url: "{{dataURL}}/../plugins/BlatSearch/CGI-BIN/blatSearch.cgi",
                    synch: true,
                    handleAs: "json",
                    timeout: 5000 * 1000,
                    load: function (response, ioArgs) {
                        if (response.search_tools.length === 0) {
                            ok = false;
                            return;
                        }
                        var replen = response.search_tools.length;
                        console.log("Response length: " + replen);
                        for (var i = 0, responselen = response.search_tools.length;
                        i < responselen; i++) {
                            content.searchBoxSelect.addOption({
                                value: response.search_tools[i],
                                label: response.search_tools[i]
                            });
                        }
                        ok = true;
                    },
                    error: function (response, ioArgs) {
                        return response;
                    }
                });
                return ok;
            };

            populateSearchBox();

            var searchBoxDiv = dom.create('div', {
                className: "section"
            }, searchInfoDiv);

            content.searchBox = new dTextarea({
                id: "searchBox"
            }).placeAt(searchBoxDiv);

            var inputOptionsDiv = dom.create('div', {
                className: "in-section"
            }, searchBoxDiv);

            var maxMatchSpan = dom.create('span', {
                innerHTML: "Number of hits to return: ",
                className: "section-span"
            }, inputOptionsDiv);

            var minIdentSpan = dom.create('span', {
                innerHTML: "Minumum percent identity: ",
                className: "section-span"
            }, inputOptionsDiv);

            content.maxMatch = new dNumberBox({
                name: "maxArea",
				value:"50",
                constraints: {
                    pattern: "#"
                }
            }, "maxArea").placeAt(maxMatchSpan);

            content.minIdent = new dNumberBox({
                name: "minArea",
				value:"75",
                constraints: {
					min:"0",
					max:"100"
                }
            }, "maxArea").placeAt(minIdentSpan);

            // Render 'search all' checkbox
            var textOptionsDiv = dom.create('div', {
                className: "section"
            }, container);

            var searchAllDiv = dom.create("div", {
                className: "checkboxdiv"
            }, textOptionsDiv);
            content.searchAll = new dCheckBox({
                label: "Search all",
                id: "search_all",
                checked: false 
            });
            searchAllDiv.appendChild(content.searchAll.domNode);
            dom.create("label", {
                "for": "search_all",
                innerHTML: "Restrict hits to current reference sequence."
            }, searchAllDiv);

            // error message if no match found
            var matchMessageDiv = dom.create("div", {
                innerHTML: "No hits found",

                className: "header"
            }, container);
            content.messageDiv = matchMessageDiv;


            // waiting icon

            var waitingIconDiv = dojo.create("div", {
                innerHTML: "<img class='waiting_image' src='plugins/BlatSearch/img/loading.gif' />",
                classname: "waiting"
            }, container);

            content.waitingIconDiv = waitingIconDiv;

            // headers for matches, hidden by default
            var headerDiv = dom.create("div", {
                className: "header",
                id:"headerDiv"
            },
            container);
            content.headerDiv = headerDiv;

            // setup dataGrid for returning matches
			var data = {
					identifier:"id",
					items: []
            };
            
            var store = new ItemFileWriteStore({data:data});
			var layout = [[
                	{'name': 'ID', 'field': 'col1', 'width':'100px'},
					{'name': 'Start', 'field': 'col2', 'width':'100px'},
					{'name': 'End', 'field': 'col3', 'width':'100px'},
					{'name': 'Score', 'field': 'col4', 'width':'100px'},
					{'name': 'Identity', 'field': 'col5', 'width':'100px'}
			]];
            
			var grid = new DataGrid({
				id: 'grid',
				store: store,
				structure: layout,
                autoWidth: true,
                sortInfo:"-5",
				rowSelector: '10 px'});

        	grid.placeAt(headerDiv);
			grid.startup();
            
            content.grid = grid;

            // div for displaying the matches

            dojo.style(matchMessageDiv, {
                display: "none"
            });
            dojo.style(waitingIconDiv, {
                display: "none"
            });
            dojo.style(headerDiv, {
                display: "none"
            });

			console.log(this);
            return container;
        },

        _getSearchParams: function () {
            var content = this.content;
            return {
                expr: content.searchBox.get('value')
            };
        },

        _fillActionBar: function (actionBar) {
            var thisB = this;

            new dButton({
                label: 'Search',
                iconClass: 'dijitIconBookmark',
                onClick: function () {
                    console.log("Click!");
                    console.log(window);
                    console.log(this);
                    var searchParams = thisB._getSearchParams();
                    thisB.callback(searchParams);
                    var content = thisB.content;
                    var toolKey = content.searchBoxSelect.get('value');
                    var refSeq = thisB.refSeq;
                    var dataRoot = thisB.dataRoot;
                    var operation = "search_sequence";
                    var headerDiv = content.headerDiv;
                                          
                    
                    dojo.style(content.messageDiv, {
                        display: "none"
                    });
                    dojo.style(content.waitingIconDiv, {
                        display: "block"
                    });
                    dojo.style(headerDiv, {
                        display: "none"
                    });
					
                    dojo.xhrPost({
                        postData: 'operation=' + operation + '&key=' + toolKey +
                            '&sequence=' + searchParams.expr + '&dataset=' + dataRoot +
                            '&refSeq=' + refSeq+'&searchAll='+content.searchAll.checked +
						   	'&maxHits='+content.maxMatch.get('value')+'&minIdent='+
						   	content.minIdent.get('value'),
                        url: "{{dataURL}}/../plugins/BlatSearch/CGI-BIN/blatSearch.cgi",
                        synch: true,
                        handleAs: "json",
                        timeout: 5000 * 1000,
                        load: function (response, ioArgs) {
                            dojo.style(content.waitingIconDiv, {
                                display: "none"
                            });
                            dojo.destroy("match_results");
                            if (response.warning === "invalid") {
                                window.alert("You search contains invalid characters. The sequence should only contain non redundant IUPAC nucleotide or amino acid codes (except for N/X)");
                                return;
                            }

                            if (response.matches.length === 0) {
                                dojo.style(content.messageDiv, {
                                    display: "block"
                                });
                                return;
                            }
                            
                            dojo.style(headerDiv, {
                                display: "block"
                            });
                            
                    
							var data = {
									identifier:"id",
									items: []
                            };

							for (var i=0 , mleng = response.matches.length; i<mleng ;i++){
								var match = response.matches[i];
								var start = match.start+1;
								var end = match.end+1;
								var ident = match.id;
								var score = match.score;
								var name = match.name;

								data.items.push(lang.mixin({id:i+1},{col1: name, col2: start, col3: end,
                                        col4: score, col5: ident}));
							}

                            console.log(data);
                            
							var store = new ItemFileWriteStore({data:data});

									content.grid.setStore(store);
                            
                                    content.grid.on("RowClick", function(evt){
                                        var idx = evt.rowIndex;
                                        var rowData = content.grid.getItem(idx);
                                        var highlight ={"ref":String(rowData.col1),"start":Number(rowData.col2),"end":Number(rowData.col3)};
                                        window.JBrowse.showRegion(highlight);
                                        window.JBrowse.setHighlightAndRedraw(highlight);
                                                
    								}, true);	 
                            
                        },
                        error: function (response, ioArgs) {
                            return response;
                        }
                    });
                }
            })
                .placeAt(actionBar);
            
			new dButton({
                label: 'Cancel',
                iconClass: 'dijitIconDelete',
                onClick: function () {
                    thisB.callback(false);
                    thisB.hide();
                }
            })
                .placeAt(actionBar);
                
            new dButton({
                label:'About',
                iconClass:'jbrowseIconHelp',
                onClick: function () {
                    new HelpDialog( lang.mixin(window.JBrowse.config.quickHelp || {}, {browser:window.JBrowse})).show();
                }
            })
                .placeAt(actionBar);
        },

        show: function (refSeq, dataRoot, browser, callback) {
            console.log('log:'+ window.location.pathname);
			this.refSeq = refSeq;
            this.dataRoot = dataRoot;
            this.browser = browser;
            this.callback = callback || function () {};
            this.set('title', "Search sequence");
            this.set('content', this._dialogContent());
            this.inherited(arguments);
            focus.focus(this.closeButtonNode);
        }

    });
});
