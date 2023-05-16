'use strict';

const form = document.getElementById('sell-form');
const btnSearch = document.getElementById('btn-search');
const inputSellID = document.getElementById('input-sellid');
const loadingBar = document.getElementById('loading-bar');
const sellCard = document.getElementById('sell_card');
const errorLayout = document.getElementById('error');
const btnDownload = document.getElementById('btn-download-receipt');
const extraData = document.getElementById('extra-data');
const inputPlace = document.getElementById('input-place');
const inputDate = document.getElementById('input-date');
const btnConfirmDownload = document.getElementById('btn-confirm-download');
const skuCheckbox = document.getElementById('sku_checkbox');

var loading = false;
var sell = {};

btnSearch.addEventListener('click', async e => {

    e.preventDefault();
    
    const sellID = inputSellID.value;
    
    if (sellID.length != 0 && !loading) {

        sellCard.classList.add('invisible');
        errorLayout.classList.add('invisible');
        loadingBar.classList.toggle('invisible');
        loading = true;    

        searchSell(sellID);
    
    }

});

async function searchSell(sellID){

        sell = await getSell(sellID);

        if (sell.id) fillSell(sell);

        else if (sell.message == 'Invalid token' || sell.message == 'expired_token') 
            location.href = '/meli/refreshtoken?go=/meli';
            
        else error();

}

async function getSell(sellID){

    const url = '/meli/sell/' + sellID;

    const response = await fetch(url, {
        method: 'GET'
    });

    return response.json();

}

function fillSell(){
    let tv_id = document.getElementById('sell_id');
    let tv_name = document.getElementById('sell_name');
    let tv_date = document.getElementById('sell_date');
    let tv_price = document.getElementById('sell_price');

    tv_id.innerText = '#' + sell.id;
    tv_name.innerText = sell.buyer.name;
    tv_date.innerText = sell.date;
    tv_price.innerText = '$' + sell.price;

    sellCard.classList.toggle('invisible');
    loadingBar.classList.toggle('invisible');
    loading = false;
}

function error(){
    sellCard.classList.add('invisible');
    errorLayout.classList.remove('invisible');
    loadingBar.classList.toggle('invisible');
    loading = false;
}

btnDownload.addEventListener('click', e => {

    inputPlace.value = 'CABA';

    const now = Date.now();
    const date = new Date(now);
    inputDate.value = date.toLocaleDateString();
    
    extraData.classList.toggle('invisible');

});

btnConfirmDownload.addEventListener('click', e => {

    const place = inputPlace.value;
    const date = inputDate.value;
    const sku = skuCheckbox.checked;

    if (place.length != 0 && date.length != 0) makePDFReceipt(place, date, sku);

});

function makePDFReceipt(place, date, sku){

    let doc = new jsPDF();

    //Tamaño horizontal: 0-210.
    //Tamaño vertical: 0-297.

    console.log(doc);

    doc.setFontSize(22);
    doc.setTextColor('#000000');
    doc.text('RECIBO DE ENTREGA DE PRODUCTO', 37, 10);

    //Draw border lines
    doc.line(10, 12, 200, 12); //top

    //Datos de quien recibe el articulo
    doc.setFontSize(20);
    doc.text('Datos de quien recibe el artículo', 12, 20);
    doc.line(12, 21, 113, 21);

    //buyer name
    doc.setFontSize(14);
    doc.setTextColor('#4d4d4d');
    doc.text('Nombre: ' + sell.buyer.name, 14, 26);

    //buyer doc
    doc.setFontSize(14);
    doc.setTextColor('#4d4d4d');
    doc.text('Documento: ' + sell.buyer.doc_number, 14, 32);

    //buyer phone
    doc.setFontSize(14);
    doc.setTextColor('#4d4d4d');
    doc.text('Teléfono: ', 14, 38);

    //Información del producto
    doc.setFontSize(20);
    doc.setTextColor('#000000');
    doc.text('Información del producto', 12, 46);
    doc.line(12, 47, 89.5, 47);

    //sell id
    doc.setFontSize(14);
    doc.setTextColor('#4d4d4d');
    doc.text('Número de operación: ' + sell.id, 14, 52);

    //articles
    doc.setFontSize(14);
    doc.setTextColor('#4d4d4d');
    doc.text('Artículos:', 14, 58);
    doc.line(14, 59, 34.5, 59);

    let Yposition = 65;
    doc.setFontSize(11);
    for (let i = -1; i++; i < sell.articles.length) {

        const article = sell.articles[i];

        const title = article.title;
        const amount = article.amount;

        let text = '"' + title + '" x ' + amount + 'u.';

        if (sku) text = text + ' (' + article.sku + ')'

        doc.setTextColor('#000000');
        doc.text('-', 16, Yposition);

        doc.setTextColor('#4d4d4d');
        doc.text(text, 18, Yposition);

        Yposition = Yposition + 6;

    }

    //Información
    Yposition = Yposition + 2;
    doc.setFontSize(20);
    doc.setTextColor('#000000');
    doc.text('Información', 12, Yposition);
    doc.line(12, Yposition + 1, 49, Yposition + 1);

    //buyer user
    Yposition = Yposition + 6;
    doc.setFontSize(14);
    doc.setTextColor('#4d4d4d');
    doc.text('Apodo comprador: ' + sell.buyer.user, 14, Yposition);

    //seller user
    Yposition = Yposition + 6;
    doc.setFontSize(14);
    doc.setTextColor('#4d4d4d');
    doc.text('Apodo vendedor: ' + sell.seller.user, 14, Yposition);

    //place
    Yposition = Yposition + 6;
    doc.setFontSize(14);
    doc.setTextColor('#4d4d4d');
    doc.text('Lugar: ' + place, 14, Yposition);

    //date
    Yposition = Yposition + 6;
    doc.setFontSize(14);
    doc.setTextColor('#4d4d4d');
    doc.text('Fecha: ' + date, 14, Yposition);

    //sign
    doc.setFontSize(12);
    doc.setTextColor('#00000');
    doc.text('Firma de quien recibe', 145, Yposition - 4);
    doc.line(140, Yposition - 8, 190, Yposition - 8);

    //draw border lines
    Yposition = Yposition + 4;
    doc.line(10, 12, 10, Yposition); //left
    doc.line(10, Yposition, 200, Yposition); //bottom
    doc.line(200, 12, 200, Yposition); //right

    //download pdf
    doc.save(sell.id + '.pdf');

    inputPlace.value = '';
    inputDate.value = '';
    extraData.classList.toggle('invisible');

}