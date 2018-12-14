define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    "mxui/dom",
    "dojo/dom",
    "dojo/dom-prop",
    "dojo/dom-geometry",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/text",
    "dojo/html",
    "dojo/_base/event",
    "dojo/text!AgGrid/widget/template/AgGrid.html",
    "https://unpkg.com/ag-grid-community/dist/ag-grid-community.min.noStyle.js"
], function (declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, 
    dojoStyle, dojoConstruct, dojoArray, lang, dojoText, dojoHtml, dojoEvent, widgetTemplate, agJS) {
    "use strict";

    return declare("AgGrid.widget.AgGrid", [ _WidgetBase, _TemplatedMixin ], {

        templateString: widgetTemplate,


        widgetBase: null,

        // Internal variables.
        _handles: null,
        _contextObj: null,
        _agGrid: null,
        //array of attribute names of object that the user selected from mx
        _listAttributes: null,

        constructor: function () {
            this._handles = [];
            this._agGrid = null;
            this._listAttributes = null;
        },

        postCreate: function () {
            logger.debug(this.id + ".postCreate");
            this._listAttributes = mx.meta.getEntity(this.listObject).getAttributes();
            console.log(this._listAttributes);
            this._getMyData();
        },

        update: function (obj, callback) {
            logger.debug(this.id + ".update");

            //this._contextObj = obj;
            //this._updateRendering(callback);
            callback();
        },

        resize: function (box) {
            logger.debug(this.id + ".resize");
        },

        uninitialize: function () {
            logger.debug(this.id + ".uninitialize");
        },

        _getMyData: function() {
            var self = this;
            mx.data.action({
                params: {
                    actionname: "TestSuite.DataTest"
                },
                callback: function(obj) {
                    self._initializeGrid(obj);
                }
            });
        },

        // basically the whole widget
        _initializeGrid: function(data) {
            logger.debug(this.id + "._initializegGrid");


            //set up the columns
            var oldColumnDefs = [
                {headerName: "Postal Code", field: "pcode", pinned: 'left', lockPinned: true, cellClass: 'lock-pinned'},
                {headerName: "Houses", field: "numHouses"},
                {headerName: "Apartments", field: "numApartments"},
                {headerName: "Businesses", field: "numBusinesses"}
            ];
            var newColumnDefs = [];
            
            for (var i=0;i<this._listAttributes.length; i++) {
                var colToPush = {
                    headerName: this._listAttributes[i],
                    field: this._listAttributes[i]
                }
                if (this._listAttributes[i] === this.stickyAttribute) {
                    colToPush.pinned = 'left';
                    colToPush.lockPinned = true;
                    colToPush.cellClass = 'lock-pinned';
                }
                newColumnDefs.push(colToPush);
            }

            //var headerNameArray = [];
            //var sourceObject = {};

            //for (var i=0;i<newColumnDefs.length;i++) {
                //headerNameArray[i] = newColumnDefs[i].headerName;
              //  sourceObject[newColumnDefs[i]] = null;
            //}

            var newRowData2 = [];
            for (var i=0;i<data.length;i++) {
                var objToPush = {};
                for (var j=0;j<newColumnDefs.length;j++) {
                    //var property = headerNameArray[j];
                    var prop = newColumnDefs[j].field;
                    objToPush[prop] = data[i].get(prop);
                }
                newRowData2.push(objToPush);
            }

            //data
            var oldrowData = [
                {make: "Toyota", model: "Celica", price: 35000},
                {make: "Ford", model: "Mustang", price: 32000},
                {make: "Porsche", model: "Boxter", price: 72000}
            ];
            var newRowData =[];

            for (var i=0;i< data.length; i++) {
                var objToPush = {
                    pcode: data[i].get("Name"),
                    numHouses: data[i].get("numHouses"),
                    numApartments: data[i].get("numApartments"),
                    numBusinesses: data[i].get("numBusinesses")
                }
                newRowData.push(objToPush);
                
                /*
                data[i].fetch("Name", function(name) {
                    console.log(name);
                    data[i].fetch("numHouses", function(numHouses) {
                        console.log(numHouses);
                        data[i].fetch("numApartments", function(numApartments) {
                            console.log(numApartments);
                            data[i].fetch("numBusinesses", function(numBusinesses) {
                                console.log(numBusinesses);
                            })
                        })
                    })
                })*/
            }

            // set up grid options including row/column data
            var gridOptions = {
                columnDefs: newColumnDefs,
                rowData: newRowData2
            };

            if (this.enableSorting) {
                gridOptions.enableSorting = true;
            }

            
            // find the node to place the grid
            var node = dojoDom.byId("myGrid");

            // set height/width based on widget properties
            dojoStyle.set(node, "height", this.height + "px");
            dojoStyle.set(node, "width", this.width + "px");


            // create the grid
            this._agGrid = new agJS.Grid(node, gridOptions);
        },

        _updateRendering: function (callback) {
            logger.debug(this.id + "._updateRendering");

            if (this._contextObj !== null) {
                dojoStyle.set(this.domNode, "display", "block");
            } else {
                dojoStyle.set(this.domNode, "display", "none");
            }

            this._executeCallback(callback, "_updateRendering");
        },

        // Function that copies an object
        //
        // to call use var obj = this._copyObject(objToCopy)
        _copyObject: function(objToCopy) {
            return Object.assign({},objToCopy);
        },

        // Shorthand for running a microflow
        _execMf: function (mf, guid, cb) {
            logger.debug(this.id + "._execMf");
            if (mf && guid) {
                mx.ui.action(mf, {
                    params: {
                        //applyto: "selection",
                        //guids: [guid]
                    },
                    callback: lang.hitch(this, function (objs) {
                        if (cb && typeof cb === "function") {
                            cb(objs);
                        }
                    }),
                    error: function (error) {
                        console.debug(error.description);
                    }
                }, this);
            }
        },

        // Shorthand for executing a callback, adds logging to your inspector
        _executeCallback: function (cb, from) {
            logger.debug(this.id + "._executeCallback" + (from ? " from " + from : ""));
            if (cb && typeof cb === "function") {
                cb();
            }
        }
    });
});

require(["AgGrid/widget/AgGrid"]);
