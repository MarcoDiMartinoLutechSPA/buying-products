sap.ui.define([
    "sap/ui/core/mvc/Controller"
], 

    function(Controller) {
        "use strict";

        return Controller.extend("sap.btp.wizard.controller.BaseController", {
            onInit: function() {

            },

            fetchDataFromOData: function(sEntitySet, oModel, aFilters, sQueryOptions) {
                return new Promise((resolve, reject) => {
                    var mParameters = {
                        filters: aFilters, 
                        success: function(oData, response) {
                            resolve(oData);
                        },
                        error: function(oError) {
                            reject(oError);
                        }
                    };
            
                    if (sQueryOptions) {
                        mParameters.urlParameters = { "$select": sQueryOptions };
                    }
                    
                    oModel.read("/" + sEntitySet, mParameters);
                });
            }
        });
    });