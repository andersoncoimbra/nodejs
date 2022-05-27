var consulta 	= require('./consultasql.js');
const firebase 	= require("firebase-admin");
var ws 			= require('ws');
var webSocket 	= new ws('ws://webfeeder.cedrotech.com/ws');
var funcoes 	= require('./funcoes.js');
var fundosArray;
var acoes;


var mensagemArray = [];

var serviceAccount = require("./fbj.json");

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://saude-investimentos-2d613-default-rtdb.firebaseio.com"
});

async function start() {
	acoes = await consulta.consultaMyql('select * from acaos');

    fundosArray = await consulta.consultaMyql('select * from acao_opcoes_listas where cod_acao in ( select acaos.nome_opcao from acaos where acaos.deleted_at is null) and vencimento LIKE "2022%" LIMIT 2000');
    totalTickers = fundosArray.length;
    mensagemArray[0] = totalTickers + ' Tickers encontrados';
    console.log(mensagemArray);
}


function assinar(token) {
	console.log(mensagemArray);
	


	fundosArray.forEach(function(regFundo) {
		// console.log(regFundo.ticker.toLowerCase());
		webSocket.send('{"token": ' + token + ',\"module": "quotes",\
		    "service": "quote",\
		    "parameterGet": ' + regFundo.nome_opcao.toLowerCase() + ',\
		    "parameters": {"subsbribetype": "1", "filter": "0,1,2,3,4,7,8,14,21,64,72,85,121,126,13,40,41,42,11,12,47,48,52,72", "delay":"5000"}\
		}', function (data, flags) { console.log('DATA - ', data, 'FLAG - ',flags)});

		// webSocket.send('{"token": ' + tokenCedro + ',\"module": "quotes",\
		//     "service": "quote",\
		//     "parameterGet": "abevg53",\
		//     "parameters": {"subsbribetype": "1", "filter": "0,1,2,3,4,7,8,14,21,64,72,85,121,126,13,40,41,42,11,12,47,48,52,72", "delay":"10000"}\
		// }');
	});
}

// 64 : Data do vencimento (Mercado de opções) Data (YYYYMMDD) ok
// 0 Horário da ultima modificação Horário (HHMMSS)
// 1 Data da última modificação Data (YYYYMMDD)
// 2 Preço do último negócio Float -
// 21 Variação Float
// 7 Quantidade do último negócio Inteiro (quantidade)
// 8 Quantidade de negócios realizados Inteiro
// 14 Preço de abertura Float
// 72 Tipo da opção (A = Americana, E = Européia, 0 = char não existe) //Retornou um "-"

// 85 Preço de Exercício Float - ok preço do strike (Bovespa)
// 121 Preço de exercício da opção Float (strike) (BMF)
// 
// 13 Preço de fechamento do dia anterior Float
// 11,12
// 40 Maior preço do dia anterior Float
// 41 Menor preço do dia anterior Float
// 48 Nome de classificação String
// ****OBS:
// mostrar nas páginas em prêmio
// em put o campo prêmio é 3
// em call o campo prêmio é 4
// 3 Melhor oferta de compra Float
// 3 - Prêmio: put 
// 
// 4 Melhor oferta de venda Float
// 4 - Prêmio: call
function vencimentoHoje()
{
	var dNow = new Date();
  	var localdate = dNow.getFullYear() + '' + ("0" + (dNow.getMonth() + 1)).slice(-2) + '' + ("0" + dNow.getDate()).slice(-2);

  	return localdate;
}

start();

webSocket.on('open', function () {
    console.log('Connected!');
    mensagemArray[1] = 'Conectado ao Websocket';
    webSocket.send('{"module": "login","service": "authentication","parameters": {"login": "bredi", "password": "102030"}}', function (data, flags) { console.log('DATA', data, 'FLAG',flags)});
});


webSocket.on('message', function (data, flags) {
    var json = JSON.parse(data);
    tokenCedro = json.token;
    if(tokenCedro != undefined){
	    assinar(tokenCedro);
	}
	console.log(json);

	if (json.values != undefined && json.parameter != undefined) {
		var array = {};
		array.cod = json.parameter.toUpperCase();

		if(json.values[3] != undefined && json.values[3] != '-') {
			array.compra = json.values[3];
			array.compra = array.compra;//.replace(".", "").replace(",", ".");
			array.premio_put = array.compra;//.replace(".", "").replace(",", ".");
		}
		if(json.values[4] != undefined && json.values[4] != '-') {
			array.venda = json.values[4];
			array.venda = array.venda;//.replace(".", "").replace(",", ".");
			array.premio_call = array.venda;//.replace(".", "").replace(",", ".");
		}

		if(json.values[64] != undefined && json.values[64] != '-') {
			array.vencimento = json.values[64];
			var parts = array.vencimento.split('/');
			array.vencimento = parts[2] + parts[1] + parts[0];
		}

		if(json.values[47] != undefined) {
			// acao: "GGBRE"
			// acao_busca: "GGBRE"
			// cod: "GGBRG197"
			// cod_empresa: "GGBR"
			// cod: 'GGBRG197', ok
			// cod_empresa: 'GGBRE', !!!!
			// acao: 'GGBRE',
			// acao_busca: 'GGBRE' } 'VALE' 'GGBRE'
			var spEmp 			= json.values[47];
			spEmp 				= spEmp.split(" ");
			array.empresa_acao 	= (spEmp[0].substr(4,1) == 'E') ? 'E' : 'A';
			array.cod_empresa 	=  spEmp[0].substr(0,4);
			array.acao  		= spEmp[0];
			array.acao_busca  	= spEmp[0];

			var empresa  	= acoes.find((acao)=>{
				// console.log(array, acao.nome_opcao, spEmp[0]);
				return acao.nome_opcao === array.cod_empresa;
			});
			array.empresa = empresa.nome + ' - ' + empresa.nome_empresa;
		}

		console.log(array.cod);
		var tipo_opcao = fundosArray.find((obj)=>{
			return obj.nome_opcao === array.cod;
		});
		
		if(json.values[40] != undefined) {
			array.fechamento = json.values[40];
		}

		if(json.values[121] != undefined) {
			//Strike
			array.preco = json.values[121];
			array.preco = array.preco;//.replace(".", "").replace(",", ".");
		}
		// if(json.values[85] != undefined) {
		// 	array.preco = json.values[85];
		// 	array.preco = array.preco;//.replace(".", "").replace(",", ".");
		// }

		if(tipo_opcao.tipo_opcao != undefined){
			if(tipo_opcao.tipo_opcao == "C"){
				firebase.database().ref('/opcoes/compra/' + json.parameter.toUpperCase()).update(array);
			}
			if(tipo_opcao.tipo_opcao == "V"){
				firebase.database().ref('/opcoes/venda/' + json.parameter.toUpperCase()).update(array);
			}
		}
		// acao:  "ABEV" ok
		// acao_busca:  "ABEV" ok
		// cod:  "ABEVG53" ok
		// cod_empresa:  "ABEV" ok
		// compra:  "0,01" ok
		// empresa: "ABEV3 - Ambev SA"
		// empresa_acao: "A" ok
		// fechamento: "0.06" ok
		// max: "0.06"-
		// med: "0.03"-
		// min: "0.03"-
		// numero: "5" ?
		// oscilacao: "100,00" ?
		// preco: "23,35" ok
		// quantidade: "77500" ?
		// vencimento: "20180716" ok
		// venda: "0,06" ok
	}
});

webSocket.on('close', function close() {
	var mensagem = "Opções - Fechou em: " + funcoes.RetornaDataHoraAtual() + "\n";
  	console.log('disconnected');
}); 
 
