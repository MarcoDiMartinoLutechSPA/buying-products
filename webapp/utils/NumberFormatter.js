sap.ui.define([], function() {
    "use strict";

    return {
        formatPrice: function(price) {
            // Converti il prezzo in un numero
            var parsedPrice = parseFloat(price);

            // Formatta il prezzo con due cifre decimali e virgola come separatore decimale
            return parsedPrice.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    };
});