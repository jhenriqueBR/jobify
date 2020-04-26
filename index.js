// importando as dependências
const express = require('express');
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const bodyParser = require('body-parser');

// Instancia o express
const app = express();

// Conexão com o SQLite
const dbConcexao = sqlite.open({ filename: 'jobify.db', driver: sqlite3.Database }); //'jobify.db', { Promise });

const initdb = async() => {
    const db = await dbConcexao;
    await db.run('CREATE TABLE IF NOT EXISTS categorias (id INTEGER PRIMARY KEY, nome TEXT)');
    await db.run('CREATE TABLE IF NOT EXISTS vagas (id INTEGER PRIMARY KEY, titulo TEXT, descricao TEXT, categoria INTEGER)');
    //await db.run(`INSERT INTO categorias (nome) VALUES ('Engineering Team')`);
    //await db.run(`INSERT INTO categorias (nome) VALUES ('Marketing Team')`);
    //await db.run(`INSERT INTO vagas (titulo, descricao, categoria) VALUES ('Fullstack Developer (Remote)', 'Vaga para desenvolver Fullstack', 1)`);
    //await db.run(`INSERT INTO vagas (titulo, descricao, categoria) VALUES ('Digital Marketing (San Francisco)', 'Vaga para Marketing', 2)`);
    //await db.run(`INSERT INTO vagas (titulo, descricao, categoria) VALUES ('Social Media (San Francisco)', 'Vaga para Social Media', 2)`);
}

initdb();

// Define que o express irá utilizar o ejs para gerar as
// páginas de saída.
app.set('view engine', 'ejs');

// Definindo a pasta para item estáticos (imagens, css, js)
// ela só será usada caso não tenha uma rota definida.
app.use(express.static('public'));

// Faz com que toda requisição passe pelo body-parser
app.use(bodyParser.urlencoded({ extended: true }));

// Quando chamar o raiz ('/') o aplicativo irá receber os 
// parâmetros  (request) e retornará algo (response)
app.get('/', async (request, response) => {
    const db = await dbConcexao;
    const categorias = await db.all('SELECT * FROM categorias');
    const vagas = await db.all('SELECT * FROM vagas');

    const categoriasMap = categorias.map(categoria => {
        return {
            ...categoria,
            vagas: vagas.filter(vaga => vaga.categoria == categoria.id)
        }
    });

    response.render('index', {
        categorias: categorias,
        vagas: vagas,
        categoriasMap: categoriasMap
    });
});

// Pagina vagas
app.get('/vaga/:id', async (request, response) => {
    const db = await dbConcexao;
    const vaga = await db.get('SELECT * FROM vagas WHERE id = ' + request.params.id);

    response.render('vaga', {
        vaga: vaga
    });
});

/*************************
 ***   ADMINISTRAÇÃO   ***
 *************************/

// Página Principal
app.get('/admin', (request, response) => {
    response.render('admin/admin');
});

// Vagas - Listar
app.get('/admin/vagas', async (request, response) => {
    const db = await dbConcexao;
    const vagas = await db.all('SELECT * FROM vagas');

    response.render('admin/vagas', {
        vagas: vagas
    });
});

// Vagas - Excluir
app.get('/admin/vagas/excluir/:id', async (request, response) => {
    const db = await dbConcexao;
    await db.run('DELETE FROM vagas WHERE id=' + request.params.id);

    response.redirect('/admin/vagas');
});

// Vagas - Nova
app.get('/admin/vagas/nova', async (request, response) => {
    const db = await dbConcexao;
    const categorias = await db.all('SELECT * FROM categorias');
    
    response.render('admin/vagas-nova', {
        categorias: categorias
    });
});

app.post('/admin/vagas/nova', async (request, response) => {
    const db = await dbConcexao;

    let { titulo, descricao, categoria } = request.body;
    
    await db.run(`INSERT INTO vagas (titulo, descricao, categoria) VALUES ('${titulo}', '${descricao}', ${categoria})`);

    response.redirect('/admin/vagas');
});

// Vagas - Editar
app.get('/admin/vagas/editar/:id', async (request, response) => {
    const db = await dbConcexao;

    const vaga = await db.get('SELECT * FROM vagas WHERE id = ' + request.params.id);
    const categorias = await db.all('SELECT * FROM categorias');
    
    response.render('admin/vagas-editar', {
        vaga: vaga,
        categorias: categorias
    });
});

app.post('/admin/vagas/editar', async (request, response) => {
    const db = await dbConcexao;

    let { id, titulo, descricao, categoria } = request.body;

    await db.run(`UPDATE vagas SET titulo='${titulo}', descricao='${descricao}', categoria=${categoria} WHERE id=${id}`);

    response.redirect('/admin/vagas');
});




// Definindo a porta onde este aplicativo irá rodar
// e exibindo mensagem no console se deu certo ou errado
app.listen(3000, (erro) => {
    if (erro) {
        console.log('Não foi possível iniciar o Jobify');
    } else {
        console.log('Jobify Iniciado.');
    }
});