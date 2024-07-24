sap.ui.define([
    "sap/btp/buyingproducts/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "../utils/NumberFormatter",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController, JSONModel, MessageBox, NumberFormatter, Spreadsheet, exportLibrary) {
        "use strict";

        const EdmType = exportLibrary.EdmType;

        return BaseController.extend("sap.btp.buyingproducts.controller.View2", {
            numberFormatter : NumberFormatter,

            onInit: function () {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.getRoute("RouteView2").attachPatternMatched(this._onRouteMatched, this);
            },
    
            _onRouteMatched: function (oEvent) {
                var sCartData = oEvent.getParameter("arguments").cartData;
                var aCartItems = JSON.parse(atob(sCartData));
    
                var oCartModel = new JSONModel({
                    cartItems: aCartItems,
                    total: this._calculateTotal(aCartItems) // Calcola il totale all'inizializzazione
                });
    
                this.getView().setModel(oCartModel, "cartModel");
            },

            _calculateTotal: function (aCartItems) {
                return aCartItems.reduce(function (sum, item) {
                    return sum + (item.UnitPrice * (item.Quantity || 1));
                }, 0);
            },

            onQuantityChange: function (oEvent) {
                var oCartModel = this.getView().getModel("cartModel");
                var aCartItems = oCartModel.getProperty("/cartItems");
                var oStepInput = oEvent.getSource();
                var oContext = oStepInput.getBindingContext("cartModel");
                var sPath = oContext.getPath();
                var iNewQuantity = oStepInput.getValue();
    
                // Aggiorna la quantità dell'articolo nel modello
                oCartModel.setProperty(sPath + "/Quantity", iNewQuantity);
    
                // Ricalcola il totale
                var iTotal = this._calculateTotal(aCartItems);
                oCartModel.setProperty("/total", iTotal);
            },

            createColumnConfig: function() {
                var aCols = [];
    
                aCols.push({
                    label: 'Nome Prodotto',
                    property: ['ProductName'],
                    type: EdmType.String,
                });

                aCols.push({
                    label: 'Quantità Per Unità',
                    property: ['QuantityPerUnit'],
                    type: EdmType.String,
                });

                aCols.push({
                    label: 'Prezzo Unitario',
                    property: ['UnitPrice'],
                    type: EdmType.Number,
                    scale: 2,
                    precision: 10,
                    format: function(value) {
                        return this.numberFormatter.formatPrice(value); // Usa il formatter per il prezzo
                    }.bind(this)
                });

                aCols.push({
                    label: 'Spedizione Da',
                    property: ['ShippingFrom'],
                    type: EdmType.String,
                });

                aCols.push({
                    label: 'Quantità Prodotto',
                    property: ['Quantity'],
                    type: EdmType.String,
                });
    
                return aCols;
            },

            onExport: function() {
                var aCols, oSettings, oSheet, aData;
                
                if (!this._oTable) {
                    this._oTable = this.byId('cartTable');
                }
            
                aCols = this.createColumnConfig();
            
                // Recupera i dati dal modello
                var aCartItems = this.getView().getModel("cartModel").getProperty("/cartItems");
            
                // Prepara i dati per l'esportazione
                aData = aCartItems.map(function(item) {
                    return {
                        ProductName: item.ProductName,
                        QuantityPerUnit: item.QuantityPerUnit,
                        UnitPrice: item.UnitPrice,
                        ShippingFrom: item.ShippingFrom,
                        Quantity: item.Quantity !== undefined ? item.Quantity : 1 // Assicura che la quantità sia sempre presente
                    };
                });
            
                oSettings = {
                    workbook: {
                        columns: aCols,
                        hierarchyLevel: 'Level'
                    },
                    dataSource: aData, // Usa i dati preparati
                    fileName: 'Table export sample.xlsx',
                    worker: false // Considera di abilitare il worker per grandi dataset
                };
            
                oSheet = new Spreadsheet(oSettings);
                oSheet.build().finally(function() {
                    oSheet.destroy();
                });
            },

            onConfirm: function () {
                var oRouter = this.getOwnerComponent().getRouter();

                MessageBox.success("Ordine confermato con successo!", {
                    onClose: function () {
                        oRouter.navTo("RouteView1");
                    }
                });
            }
        });  
    });
