sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/btp/buyingproducts/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "../utils/NumberFormatter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (JSONModel, ODataModel, BaseController, Filter, FilterOperator, MessageBox, NumberFormatter) {
        "use strict";

        const url_oData = "/V2/Northwind/Northwind.svc/";

        return BaseController.extend("sap.btp.buyingproducts.controller.View1", {
            numberFormatter : NumberFormatter,

            onInit: function () {
                this.loadProductsAndSuppliers();

                // Inizializza il modello per il conteggio degli articoli nel carrello
                var oCartModel = new JSONModel({
                    itemCount: 0,
                    cartItems: []
                });

                this.getView().setModel(oCartModel, "cartModel");

                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.getRoute("RouteView1").attachPatternMatched(this._onRouteMatched, this);
            },

            _onRouteMatched: function () {
                this.resetModels();
                this.clearFilters();
            },

            clearFilters: function() {
                var oSmartFilterBar = this.byId("filterBar");

                if (oSmartFilterBar) {
                    oSmartFilterBar.clear();
                }
            },
    
            resetModels: function() {
                // Ripristina i modelli ai loro stati iniziali
                this.loadProductsAndSuppliers(); // Ricarica i prodotti e i fornitori
    
                var oCartModel = this.getView().getModel("cartModel");
                oCartModel.setData({
                    itemCount: 0,
                    cartItems: []
                });
    
                // Aggiorna la visibilità del contatore degli articoli nel carrello
                this._updateCartItemCountVisibility();
            },

            onNavigateToView2: function () {
                var oCartModel = this.getView().getModel("cartModel");
                var iItemCount = oCartModel.getProperty("/itemCount");

                if (iItemCount === 0) {
                    MessageBox.error("Aggiungi un articolo al carrello");
                    return;
                }

                var oRouter = this.getOwnerComponent().getRouter();
                var sCartData = btoa(JSON.stringify(oCartModel.getProperty("/cartItems")));
        
                oRouter.navTo("RouteView2", {
                    cartData: sCartData
                });
            },

            loadProductsAndSuppliers: function(aFilters) {
                var oModel = new ODataModel(url_oData);
            
                Promise.all([
                    this.fetchDataFromOData("Products", oModel, aFilters, null),
                    this.fetchDataFromOData("Suppliers", oModel, null, null)
                ]).then(function(aData) {
                    var aProducts = aData[0].results;
                    var aSuppliers = aData[1].results;
            
                    // Aggiungi il campo InCart a ciascun prodotto e inizializzalo a false
                    aProducts.forEach(function(oProduct) {
                        oProduct.InCart = false;
                    });
            
                    var oSupplierMap = {};
                    aSuppliers.forEach(function(oSupplier) {
                        oSupplierMap[oSupplier.SupplierID] = oSupplier.City;
                    });
            
                    aProducts.forEach(function(oProduct) {
                        oProduct.ShippingFrom = oSupplierMap[oProduct.SupplierID] || "Unknown";
                    });
            
                    var oProductsModel = new JSONModel(aProducts);
                    this.getView().setModel(oProductsModel, "productsTableModel");
                }.bind(this)).catch(function(error) {
                    console.error("Errore durante il recupero dei dati:", error);
                });
            },

            onSearch: function (oEvent) {
                var oFilterBar = oEvent.getSource();
                var aFilters = [];

                var oFilter = new Filter("UnitsInStock", FilterOperator.NE, 0);
                aFilters.push(oFilter);

                // Ottieni il valore del filtro per il ProductName
                oFilterBar.getFilterGroupItems().forEach(function(oFilterGroupItem) {
                    var sName = oFilterGroupItem.getName();
                    if (sName === "productName") {
                        var sProductName = oFilterGroupItem.getControl().getValue();
                        if (sProductName) {
                            var oProductFilter = new Filter("ProductName", FilterOperator.Contains, sProductName);
                            aFilters.push(oProductFilter);
                        }
                    }
                });

                // Ricarica i dati con i filtri applicati
                this.loadProductsAndSuppliers(aFilters);
            },

            onAddToCart: function (oEvent) {
                var oCartModel = this.getView().getModel("cartModel");
                var iCount = oCartModel.getProperty("/itemCount");
            
                // Verifica se l'articolo è già presente nel carrello
                var oContext = oEvent.getSource().getBindingContext("productsTableModel");
                var sProductId = oContext.getProperty("ProductID");
                var aCartItems = oCartModel.getProperty("/cartItems") || [];
                var bItemExists = aCartItems.some(function(item) {
                    return item.ProductID === sProductId;
                });
            
                if (bItemExists) {
                    MessageBox.error("Articolo già aggiunto al carrello");
                    return;
                }
            
                // Aggiorna il conteggio degli articoli nel carrello
                oCartModel.setProperty("/itemCount", iCount + 1);
            
                // Aggiungi l'articolo al carrello
                var oCartItem = oContext.getObject();
                aCartItems.push(oCartItem);
                oCartModel.setProperty("/cartItems", aCartItems);
            
                // Imposta lo stato del pulsante "Remove from cart" su true
                oContext.getModel().setProperty(oContext.getPath() + "/InCart", true);
            
                this._updateCartItemCountVisibility();
            },

            onRemoveFromCart: function(oEvent) {
                var oCartModel = this.getView().getModel("cartModel");
                var iCount = oCartModel.getProperty("/itemCount");
            
                // Riduci il conteggio degli articoli nel carrello
                if (iCount > 0) {
                    oCartModel.setProperty("/itemCount", iCount - 1);
                }
            
                // Aggiorna l'elenco degli articoli nel carrello
                var oContext = oEvent.getSource().getBindingContext("productsTableModel");
                var sProductId = oContext.getProperty("ProductID");
                var aCartItems = oCartModel.getProperty("/cartItems") || [];
                var aUpdatedCartItems = aCartItems.filter(function(item) {
                    return item.ProductID !== sProductId;
                });
                oCartModel.setProperty("/cartItems", aUpdatedCartItems);
            
                // Aggiorna lo stato del pulsante "Remove from cart"
                oContext.getModel().setProperty(oContext.getPath() + "/InCart", false);
            
                this._updateCartItemCountVisibility();
            },

            _updateCartItemCountVisibility: function() {
                var oCartModel = this.getView().getModel("cartModel");
                var iItemCount = oCartModel.getProperty("/itemCount");
                var oCartItemCount = this.byId("cartItemCount");
            
                if (iItemCount > 0) {
                    oCartItemCount.setVisible(true);
                } else {
                    oCartItemCount.setVisible(false);
                }
            }
        });  
    });

