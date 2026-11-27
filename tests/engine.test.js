import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function loadScript(filePath, sandbox = {}) {
    const code = fs.readFileSync(filePath, 'utf8');
    const topLevelIdentifiers = [...code.matchAll(/^(?:class|const|function)\s+([a-zA-Z0-9_$]+)/gm)].map(m => m[1]);
    const unique = [...new Set(topLevelIdentifiers)].join(', ');
    const wrapped = `(function() {\n${code}\nreturn { ${unique} };\n})()`;
    return vm.runInNewContext(wrapped, sandbox);
}

describe('Player & Body Types', () => {
    test('limites de energia e fome', () => {
        const ctx = loadScript(path.resolve('scripts/player.js'), {});
        const player = new ctx.Player('Alex');

        player.modifyEnergy(50);
        assert.equal(player.energy, 100);

        player.modifyEnergy(-150);
        assert.equal(player.energy, 0);

        player.modifyHunger(150);
        assert.equal(player.hunger, 100);
    });

    test('cálculo do tipo corporal', () => {
        const ctx = loadScript(path.resolve('scripts/player.js'), {});
        const player = new ctx.Player('Alex');
        player.fat = 20;
        player.muscle = 20;
        assert.equal(player.getBodyTypeInfo().id, 'magro');

        player.fat = 80;
        player.muscle = 80;
        assert.equal(player.getBodyTypeInfo().id, 'colossal');
    });

    test('gênero e flexão do tipo corporal', () => {
        const ctx = loadScript(path.resolve('scripts/player.js'), {});

        const male = new ctx.Player('João', 'masculino');
        male.fat = 20;
        male.muscle = 20;
        assert.equal(male.gender, 'masculino');
        assert.equal(male.getBodyTypeInfo().display_name, 'Magro');

        const female = new ctx.Player('Maria', 'feminino');
        female.fat = 20;
        female.muscle = 20;
        assert.equal(female.gender, 'feminino');
        assert.equal(female.getBodyTypeInfo().display_name, 'Magra');

        const other = new ctx.Player('Sam', 'outro');
        other.fat = 20;
        other.muscle = 20;
        assert.equal(other.gender, 'outro');
        assert.equal(other.getBodyTypeInfo().display_name, 'Magro(a)');
    });

    test('Player inicializa houseUpgrades.patio como false e unlockHouseUpgrade desbloqueia', () => {
        const ctx = loadScript(path.resolve('scripts/player.js'), {});
        const player = new ctx.Player('Alex');

        assert.equal(player.houseUpgrades.patio, false);
        assert.equal(player.hasHouseUpgrade('patio'), false);

        player.unlockHouseUpgrade('patio');
        assert.equal(player.houseUpgrades.patio, true);
        assert.equal(player.hasHouseUpgrade('patio'), true);
    });

    test('Player inicializa houseUpgrades.piscina como false e unlockHouseUpgrade("piscina") desbloqueia', () => {
        const ctx = loadScript(path.resolve('scripts/player.js'), {});
        const player = new ctx.Player('Alex');

        assert.equal(player.houseUpgrades.piscina, false);
        assert.equal(player.hasHouseUpgrade('piscina'), false);

        player.unlockHouseUpgrade('piscina');
        assert.equal(player.houseUpgrades.piscina, true);
        assert.equal(player.hasHouseUpgrade('piscina'), true);
    });

    test('setClothes normaliza ID ou label legado e getClothesName retorna o nome de exibição', () => {
        const ctx = loadScript(path.resolve('scripts/player.js'), {});
        const player = new ctx.Player('Alex');

        player.setClothes('esporte');
        assert.equal(player.clothes, 'esporte');
        assert.equal(player.getClothesName(), 'Roupa Esportiva 🏃');

        player.setClothes('Roupa Esportiva 🏃');
        assert.equal(player.clothes, 'esporte');
        assert.equal(player.getClothesName(), 'Roupa Esportiva 🏃');

        player.setClothes('Camiseta e Jeans 👕');
        assert.equal(player.clothes, 'casual');
        assert.equal(player.getClothesName(), 'Camiseta e Jeans 👕');
    });

    test('Player inicializa aparência com defaults ou valores passados e setHair atualiza apenas o cabelo', () => {
        const ctx = loadScript(path.resolve('scripts/player.js'), {});

        const defaultPlayer = new ctx.Player('Alex');
        assert.equal(defaultPlayer.skinTone, 'medio');
        assert.equal(defaultPlayer.height, 'medio');
        assert.equal(defaultPlayer.hairStyle, 'curto');
        assert.equal(defaultPlayer.hairColor, 'castanho');

        const customPlayer = new ctx.Player('Maria', 'feminino', {
            skinTone: 'escuro',
            height: 'alto',
            hairStyle: 'cacheado',
            hairColor: 'preto'
        });
        assert.equal(customPlayer.skinTone, 'escuro');
        assert.equal(customPlayer.height, 'alto');
        assert.equal(customPlayer.hairStyle, 'cacheado');
        assert.equal(customPlayer.hairColor, 'preto');

        customPlayer.setHair('longo', 'ruivo');
        assert.equal(customPlayer.hairStyle, 'longo');
        assert.equal(customPlayer.hairColor, 'ruivo');

        const protoMethods = Object.getOwnPropertyNames(ctx.Player.prototype);
        assert.equal(protoMethods.some(m => /^set(Gender|SkinTone|Height)$/i.test(m)), false);
    });
});

describe('Time System', () => {
    test('avanço de horas e aumento proporcional de fome', () => {
        const playerCtx = loadScript(path.resolve('scripts/player.js'), {});
        const timeCtx = loadScript(path.resolve('scripts/time.js'), {});

        const player = new playerCtx.Player('Alex');
        const time = new timeCtx.TimeSystem();

        const fakeGame = {
            player,
            checkStatusConditions: () => {}
        };

        time.advanceTime(2, fakeGame);
        assert.equal(time.hour, 10);
        assert.equal(player.hunger, 4);
    });
});

describe('Market System', () => {
    test('compra de roupas e comida respeita saldo', () => {
        const playerCtx = loadScript(path.resolve('scripts/player.js'), {});
        const timeCtx = loadScript(path.resolve('scripts/time.js'), {});
        const marketCtx = loadScript(path.resolve('scripts/market.js'), {
            wardrobeOptions: playerCtx.wardrobeOptions
        });

        const player = new playerCtx.Player('Alex');
        const time = new timeCtx.TimeSystem();
        player.money = 10;

        const fakeGame = {
            player,
            time,
            checkStatusConditions: () => {},
            log: () => {},
            updateUI: () => {},
            renderActions: () => {}
        };

        const clothingActions = marketCtx.market.getClothingActions(fakeGame);
        const buyFancyClothes = clothingActions.find(a => a.label.includes('Roupa Esportiva'));
        buyFancyClothes.execute(fakeGame);
        assert.equal(player.hasOutfit('esporte'), false);
        assert.equal(player.money, 10);

        const foodActions = marketCtx.market.getFoodActions();
        const buyWater = foodActions.find(a => a.label.includes('Garrafa de Água'));
        buyWater.execute(fakeGame);
        assert.equal(player.money, 5);
        assert.equal(marketCtx.market.catalog.comida[0].stock, 1);
    });
});

describe('HTML Integrity', () => {
    test('sem IDs duplicados no index.html', () => {
        const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
        const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
        const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
        assert.deepEqual(duplicates, []);
    });

    test('presença dos IDs do menu inicial e criação de personagem', () => {
        const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
        const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
        const requiredIds = [
            'start-screen',
            'start-menu-step',
            'character-creation-step',
            'input-name',
            'input-gender',
            'creation-error',
            'game-container',
            'p-gender'
        ];

        requiredIds.forEach(id => {
            assert.equal(ids.has(id), true, `ID ausente no index.html: ${id}`);
        });
    });

    test('presença dos IDs de exportar e importar save', () => {
        const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
        const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
        const saveIds = [
            'settings-btn',
            'settings-modal',
            'export-code',
            'import-game-step',
            'import-code',
            'import-file',
            'import-error'
        ];

        saveIds.forEach(id => {
            assert.equal(ids.has(id), true, `ID ausente no index.html: ${id}`);
        });
    });

    test('presença do botão btn-exit-to-menu no index.html', () => {
        const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
        const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
        assert.equal(ids.has('btn-exit-to-menu'), true, 'ID ausente no index.html: btn-exit-to-menu');
    });

    test('presença do botão da imobiliária no index.html', () => {
        const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
        assert.match(html, /onclick="game\.changeLocation\('imobiliaria'\)"/);
    });

    test('presença do botão do Pet Shop no index.html', () => {
        const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
        assert.match(html, /onclick="game\.changeLocation\('petshop'\)"/);
    });

    test('presença do botão do Cabeleireiro no index.html', () => {
        const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
        assert.match(html, /onclick="game\.changeLocation\('cabeleireiro'\)"/);
    });

    test('presença do ID t-rent-cost no index.html', () => {
        const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
        const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
        assert.equal(ids.has('t-rent-cost'), true, 'ID ausente no index.html: t-rent-cost');
    });

    test('presença dos IDs do painel de status do pet no index.html', () => {
        const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
        const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
        const petIds = [
            'pet-status-panel',
            'pet-name',
            'pet-energy-bar',
            'pet-hunger-bar',
            'pet-hygiene-bar',
            'pet-happiness-bar'
        ];

        petIds.forEach(id => {
            assert.equal(ids.has(id), true, `ID ausente no index.html: ${id}`);
        });
    });

    test('presença dos IDs de aparência no index.html e ausência de hair-modal', () => {
        const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
        const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
        const appearanceIds = [
            'input-skin-tone',
            'input-height',
            'input-hair-style',
            'input-hair-color',
            'p-skin-tone',
            'p-height',
            'p-hair'
        ];

        appearanceIds.forEach(id => {
            assert.equal(ids.has(id), true, `ID ausente no index.html: ${id}`);
        });
        assert.equal(ids.has('hair-modal'), false, 'ID hair-modal não deve existir no index.html');
    });

    test('presença dos IDs e classes das barras de status do jogador no index.html', () => {
        const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
        const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
        const barIds = ['p-energy-bar', 'p-hunger-bar', 'p-muscle-bar', 'p-fat-bar'];
        barIds.forEach(id => {
            assert.equal(ids.has(id), true, `ID ausente no index.html: ${id}`);
        });

        const barClasses = ['bar-energy', 'bar-hunger', 'bar-muscle', 'bar-fat'];
        barClasses.forEach(cls => {
            assert.match(html, new RegExp(`class="[^"]*\\b${cls}\\b[^"]*"`), `Classe ausente no index.html: ${cls}`);
        });
    });
});

describe('Character Creation', () => {
    test('startNewGame bloqueia nome vazio, exibe erro e não instancia jogo', () => {
        const elements = {
            'input-name': { value: '   ' },
            'creation-error': { innerText: '', style: { display: 'none' } }
        };

        const mainCtx = loadScript(path.resolve('scripts/main.js'), {
            document: {
                getElementById: (id) => elements[id]
            },
            Player: class {
                constructor() {
                    throw new Error('Player não deveria ser instanciado');
                }
            },
            TimeSystem: class {}
        });

        mainCtx.startNewGame();

        assert.equal(elements['creation-error'].style.display, 'block');
        assert.ok(elements['creation-error'].innerText.length > 0);
    });

    test('startNewGame lê inputs de aparência e updateUI exibe pele, altura e cabelo (incluindo Careca)', () => {
        const playerCtx = loadScript(path.resolve('scripts/player.js'), {});
        let createdPlayer = null;
        class SpyPlayer extends playerCtx.Player {
            constructor(...args) {
                super(...args);
                createdPlayer = this;
            }
        }

        const { mainCtx, elements } = setupGameContext({ Player: SpyPlayer });
        elements.set('input-name', { value: 'Marina' });
        elements.set('input-gender', { value: 'feminino' });
        elements.set('input-skin-tone', { value: 'medio_escuro' });
        elements.set('input-height', { value: 'alto' });
        elements.set('input-hair-style', { value: 'cacheado' });
        elements.set('input-hair-color', { value: 'ruivo' });

        mainCtx.startNewGame();

        assert.ok(createdPlayer);
        assert.equal(createdPlayer.name, 'Marina');
        assert.equal(createdPlayer.gender, 'feminino');
        assert.equal(createdPlayer.skinTone, 'medio_escuro');
        assert.equal(createdPlayer.height, 'alto');
        assert.equal(createdPlayer.hairStyle, 'cacheado');
        assert.equal(createdPlayer.hairColor, 'ruivo');

        assert.equal(elements.get('p-skin-tone').innerText, 'Médio-escuro');
        assert.equal(elements.get('p-height').innerText, 'Alto(a)');
        assert.equal(elements.get('p-hair').innerText, 'Cacheado (Ruivo)');

        const baldEngine = new mainCtx.GameEngine('Marina', 'feminino', null, {
            hairStyle: 'careca',
            hairColor: 'loiro'
        });
        assert.equal(baldEngine.player.hairStyle, 'careca');
        assert.equal(elements.get('p-hair').innerText, 'Careca');
    });

    test('updateUI atualiza .value das barras de energia, fome, músculo e gordura do jogador', () => {
        const { mainCtx, elements } = setupGameContext();
        const engine = new mainCtx.GameEngine('Marina', 'feminino');

        engine.player.energy = 64;
        engine.player.hunger = 28;
        engine.player.muscle = 42;
        engine.player.fat = 19;

        engine.updateUI();

        assert.equal(elements.get('p-energy-bar').value, 64);
        assert.equal(elements.get('p-hunger-bar').value, 28);
        assert.equal(elements.get('p-muscle-bar').value, 42);
        assert.equal(elements.get('p-fat-bar').value, 19);
    });
});

describe('Save System', () => {
    function loadSaveScript() {
        return loadScript(path.resolve('scripts/save.js'), { btoa, atob });
    }

    test('exportSaveState e importSaveState preservam estado completo e UTF-8', () => {
        const saveCtx = loadSaveScript();
        const game = {
            player: {
                name: 'João Conceição',
                gender: 'masculino',
                energy: 65,
                maxEnergy: 100,
                hunger: 30,
                money: 420,
                clothes: 'Terno Social 🤵',
                fat: 45,
                muscle: 55,
                isEmployed: true,
                taskQueue: 3,
                houseUpgrades: { patio: true },
                pet: null
            },
            time: { day: 5, hour: 14, minute: 30 },
            currentEnvironment: 'trabalho',
            currentSubRoom: 'escritorio'
        };
        const wardrobeList = [
            { id: 'pijama', owned: true },
            { id: 'casual', owned: true },
            { id: 'terno', owned: true },
            { id: 'esporte', owned: false }
        ];
        const marketData = {
            comida: [
                { id: 'agua', stock: 2 },
                { id: 'maca', stock: 4 }
            ]
        };

        const code = saveCtx.exportSaveState(game, wardrobeList, marketData);
        assert.ok(code.startsWith('LS1:'));

        const imported = structuredClone(saveCtx.importSaveState(code));
        assert.deepEqual(imported.player, game.player);
        assert.deepEqual(imported.time, game.time);
        assert.deepEqual(imported.ownedOutfits, ['pijama', 'casual', 'terno']);
        assert.deepEqual(imported.foodStock, { agua: 2, maca: 4 });
        assert.deepEqual(imported.location, {
            currentEnvironment: 'trabalho',
            currentSubRoom: 'escritorio'
        });
    });

    test('importSaveState rejeita string vazia, prefixo errado, checksum adulterado e JSON corrompido', () => {
        const saveCtx = loadSaveScript();
        const validCode = saveCtx.exportSaveState(
            {
                player: { name: 'Alex' },
                time: { day: 1, hour: 8, minute: 0 },
                currentEnvironment: 'casa',
                currentSubRoom: 'quarto'
            },
            [],
            { comida: [] }
        );
        const [, validChecksum, validBase64] = validCode.split(':');

        assert.throws(() => saveCtx.importSaveState(''), /inválido ou corrompido/);
        assert.throws(() => saveCtx.importSaveState('   '), /inválido ou corrompido/);
        assert.throws(() => saveCtx.importSaveState(`LS2:${validChecksum}:${validBase64}`), /inválido ou corrompido/);

        const tamperedChecksum = String(Number(validChecksum) + 1);
        assert.throws(() => saveCtx.importSaveState(`LS1:${tamperedChecksum}:${validBase64}`), /inválido ou corrompido/);

        const corruptedBase64 = btoa('{json_invalido');
        const corruptedChecksum = saveCtx.computeSaveChecksum(corruptedBase64);
        assert.throws(() => saveCtx.importSaveState(`LS1:${corruptedChecksum}:${corruptedBase64}`), /inválido ou corrompido/);
    });

    test('GameEngine.fromSave restaura player, time, roupas, estoque de comida e localização', () => {
        const playerCtx = loadScript(path.resolve('scripts/player.js'), {});
        const timeCtx = loadScript(path.resolve('scripts/time.js'), {});
        const marketCtx = loadScript(path.resolve('scripts/market.js'), {
            wardrobeOptions: playerCtx.wardrobeOptions
        });

        const elements = new Map();
        const getEl = (id) => {
            if (!elements.has(id)) {
                elements.set(id, {
                    id,
                    innerText: '',
                    innerHTML: '',
                    style: {},
                    scrollTop: 0,
                    scrollHeight: 0,
                    appendChild: () => {}
                });
            }
            return elements.get(id);
        };

        const rooms = {
            casa: {
                isEnvironment: true,
                subRooms: {
                    quarto: { name: 'Quarto', actions: [] },
                    cozinha: { name: 'Cozinha', actions: [] }
                }
            }
        };

        const mainCtx = loadScript(path.resolve('scripts/main.js'), {
            Player: playerCtx.Player,
            TimeSystem: timeCtx.TimeSystem,
            wardrobeOptions: playerCtx.wardrobeOptions,
            market: marketCtx.market,
            rooms,
            document: {
                getElementById: getEl,
                createElement: () => ({
                    className: '',
                    innerText: '',
                    style: {},
                    disabled: false,
                    onclick: null
                })
            }
        });

        const saveData = {
            player: {
                name: 'Maria Clara',
                gender: 'feminino',
                energy: 42,
                maxEnergy: 100,
                hunger: 18,
                money: 310,
                clothes: 'esporte',
                fat: 35,
                muscle: 60,
                isEmployed: true,
                taskQueue: 2,
                houseUpgrades: { patio: true }
            },
            time: { day: 4, hour: 16, minute: 0 },
            ownedOutfits: ['pijama', 'esporte'],
            foodStock: { agua: 3, lanche: 1 },
            location: { currentEnvironment: 'casa', currentSubRoom: 'cozinha' }
        };

        const engine = mainCtx.GameEngine.fromSave(saveData);

        assert.equal(engine.player.name, 'Maria Clara');
        assert.equal(engine.player.gender, 'feminino');
        assert.equal(engine.player.energy, 42);
        assert.equal(engine.player.hunger, 18);
        assert.equal(engine.player.money, 310);
        assert.equal(engine.player.clothes, 'esporte');
        assert.equal(engine.player.getClothesName(), 'Roupa Esportiva 🏃');
        assert.equal(engine.player.isEmployed, true);
        assert.equal(engine.player.taskQueue, 2);
        assert.deepEqual(structuredClone(engine.player.houseUpgrades), { patio: true, piscina: false });
        assert.equal(engine.player.hasHouseUpgrade('patio'), true);

        assert.equal(engine.time.day, 4);
        assert.equal(engine.time.hour, 16);
        assert.equal(engine.time.minute, 0);

        assert.equal(playerCtx.wardrobeOptions.find(o => o.id === 'pijama').owned, true);
        assert.equal(playerCtx.wardrobeOptions.find(o => o.id === 'esporte').owned, true);
        assert.equal(playerCtx.wardrobeOptions.find(o => o.id === 'casual').owned, false);

        assert.equal(marketCtx.market.catalog.comida.find(i => i.id === 'agua').stock, 3);
        assert.equal(marketCtx.market.catalog.comida.find(i => i.id === 'lanche').stock, 1);

        assert.equal(engine.currentEnvironment, 'casa');
        assert.equal(engine.currentSubRoom, 'cozinha');
        assert.equal(getEl('room-title').innerText, '🏠 Casa - Cozinha');
    });

    test('GameEngine.fromSave normaliza roupa legada ("Roupa Esportiva 🏃" -> "esporte")', () => {
        const playerCtx = loadScript(path.resolve('scripts/player.js'), {});
        const timeCtx = loadScript(path.resolve('scripts/time.js'), {});
        const marketCtx = loadScript(path.resolve('scripts/market.js'), {
            wardrobeOptions: playerCtx.wardrobeOptions
        });

        const elements = new Map();
        const getEl = (id) => {
            if (!elements.has(id)) {
                elements.set(id, {
                    id,
                    innerText: '',
                    innerHTML: '',
                    style: {},
                    scrollTop: 0,
                    scrollHeight: 0,
                    appendChild: () => {}
                });
            }
            return elements.get(id);
        };

        const rooms = {
            casa: {
                isEnvironment: true,
                subRooms: {
                    quarto: { name: 'Quarto', actions: [] }
                }
            }
        };

        const mainCtx = loadScript(path.resolve('scripts/main.js'), {
            Player: playerCtx.Player,
            TimeSystem: timeCtx.TimeSystem,
            wardrobeOptions: playerCtx.wardrobeOptions,
            market: marketCtx.market,
            rooms,
            document: {
                getElementById: getEl,
                createElement: () => ({
                    className: '',
                    innerText: '',
                    style: {},
                    disabled: false,
                    onclick: null
                })
            }
        });

        const engine = mainCtx.GameEngine.fromSave({
            player: { name: 'Alex', clothes: 'Roupa Esportiva 🏃' },
            time: { day: 1, hour: 10, minute: 0 },
            ownedOutfits: ['pijama', 'esporte']
        });

        assert.equal(engine.player.clothes, 'esporte');
        assert.equal(engine.player.getClothesName(), 'Roupa Esportiva 🏃');
    });

    test('exportSaveState e GameEngine.fromSave preservam aparência e aplicam fallbacks em saves antigos', () => {
        const saveCtx = loadSaveScript();
        const { mainCtx } = setupGameContext();

        const original = new mainCtx.GameEngine('Lara', 'feminino', null, {
            skinTone: 'claro',
            height: 'baixo',
            hairStyle: 'crespo',
            hairColor: 'colorido'
        });
        const code = saveCtx.exportSaveState(original, [], { comida: [] });
        const restored = mainCtx.GameEngine.fromSave(saveCtx.importSaveState(code));

        assert.equal(restored.player.skinTone, 'claro');
        assert.equal(restored.player.height, 'baixo');
        assert.equal(restored.player.hairStyle, 'crespo');
        assert.equal(restored.player.hairColor, 'colorido');

        const legacyEngine = mainCtx.GameEngine.fromSave({
            player: { name: 'Legacy' },
            time: { day: 1, hour: 8, minute: 0 }
        });
        assert.equal(legacyEngine.player.skinTone, 'medio');
        assert.equal(legacyEngine.player.height, 'medio');
        assert.equal(legacyEngine.player.hairStyle, 'curto');
        assert.equal(legacyEngine.player.hairColor, 'castanho');
    });
});

describe('Exit to Start Screen', () => {
    function setupExitContext(confirmResult) {
        const playerCtx = loadScript(path.resolve('scripts/player.js'), {});
        const marketCtx = loadScript(path.resolve('scripts/market.js'), {
            wardrobeOptions: playerCtx.wardrobeOptions
        });

        playerCtx.wardrobeOptions.forEach(item => {
            item.owned = true;
        });
        marketCtx.market.catalog.comida.forEach(item => {
            item.stock = 3;
        });

        const elements = {
            log: { innerHTML: '<p>Evento</p>' },
            'input-name': { value: 'Alex' },
            'input-gender': { value: 'outro' },
            'input-skin-tone': { value: 'escuro' },
            'input-height': { value: 'alto' },
            'input-hair-style': { value: 'longo' },
            'input-hair-color': { value: 'colorido' },
            'import-code': { value: 'LS1:123:abc' },
            'import-file': { value: 'save.txt' },
            'settings-modal': { style: { display: 'flex' } },
            'wardrobe-modal': { style: { display: 'flex' } },
            'gameover-modal': { style: { display: 'flex' } },
            'game-container': { style: { display: 'block' } },
            'start-screen': { style: { display: 'none' } },
            'character-creation-step': { style: { display: 'block' } },
            'import-game-step': { style: { display: 'block' } },
            'start-menu-step': { style: { display: 'none' } },
            'creation-error': { style: { display: 'block' } },
            'import-error': { style: { display: 'block' } }
        };

        const mainCtx = loadScript(path.resolve('scripts/main.js'), {
            confirm: () => confirmResult,
            wardrobeOptions: playerCtx.wardrobeOptions,
            market: marketCtx.market,
            document: {
                getElementById: (id) => elements[id]
            }
        });

        return { mainCtx, playerCtx, marketCtx, elements };
    }

    test('não reseta estado nem oculta #game-container quando confirm() retorna false', () => {
        const { mainCtx, playerCtx, marketCtx, elements } = setupExitContext(false);

        mainCtx.exitToStartScreen();

        assert.equal(playerCtx.wardrobeOptions.every(item => item.owned === true), true);
        assert.equal(marketCtx.market.catalog.comida.every(item => item.stock === 3), true);
        assert.equal(elements.log.innerHTML, '<p>Evento</p>');
        assert.equal(elements['input-name'].value, 'Alex');
        assert.equal(elements['import-code'].value, 'LS1:123:abc');
        assert.equal(elements['import-file'].value, 'save.txt');
        assert.equal(elements['settings-modal'].style.display, 'flex');
        assert.equal(elements['game-container'].style.display, 'block');
        assert.equal(elements['start-screen'].style.display, 'none');
    });

    test('reseta estado, limpa log e formulários, fecha modais e exibe #start-screen quando confirm() retorna true', () => {
        const { mainCtx, playerCtx, marketCtx, elements } = setupExitContext(true);

        mainCtx.exitToStartScreen();

        playerCtx.wardrobeOptions.forEach(item => {
            assert.equal(item.owned, item.price === 0);
        });
        assert.equal(marketCtx.market.catalog.comida.every(item => item.stock === 0), true);
        assert.equal(elements.log.innerHTML, '');
        assert.equal(elements['input-name'].value, '');
        assert.equal(elements['import-code'].value, '');
        assert.equal(elements['import-file'].value, '');
        assert.equal(elements['settings-modal'].style.display, 'none');
        assert.equal(elements['wardrobe-modal'].style.display, 'none');
        assert.equal(elements['gameover-modal'].style.display, 'none');
        assert.equal(elements['input-gender'].value, 'masculino');
        assert.equal(elements['input-skin-tone'].value, 'medio');
        assert.equal(elements['input-height'].value, 'medio');
        assert.equal(elements['input-hair-style'].value, 'curto');
        assert.equal(elements['input-hair-color'].value, 'castanho');
        assert.equal(elements['game-container'].style.display, 'none');
        assert.equal(elements['start-screen'].style.display, 'block');
        assert.equal(elements['start-menu-step'].style.display, 'block');
        assert.equal(elements['character-creation-step'].style.display, 'none');
        assert.equal(elements['import-game-step'].style.display, 'none');
    });
});

function setupGameContext(extraGlobals = {}) {
    const playerCtx = loadScript(path.resolve('scripts/player.js'), {});
    const timeCtx = loadScript(path.resolve('scripts/time.js'), {});
    const marketCtx = loadScript(path.resolve('scripts/market.js'), {
        wardrobeOptions: playerCtx.wardrobeOptions
    });
    const roomsCtx = loadScript(path.resolve('scripts/rooms.js'), { ...extraGlobals });

    const elements = new Map();
    const getEl = (id) => {
        if (!elements.has(id)) {
            elements.set(id, {
                id,
                innerText: '',
                _innerHTML: '',
                get innerHTML() {
                    return this._innerHTML;
                },
                set innerHTML(val) {
                    this._innerHTML = val;
                    if (val === '') this.children = [];
                },
                style: {},
                scrollTop: 0,
                scrollHeight: 0,
                children: [],
                appendChild(child) {
                    this.children.push(child);
                }
            });
        }
        return elements.get(id);
    };

    const mainCtx = loadScript(path.resolve('scripts/main.js'), {
        Player: playerCtx.Player,
        TimeSystem: timeCtx.TimeSystem,
        wardrobeOptions: playerCtx.wardrobeOptions,
        market: marketCtx.market,
        rooms: roomsCtx.rooms,
        document: {
            getElementById: getEl,
            createElement: () => ({
                className: '',
                innerText: '',
                style: {},
                disabled: false,
                onclick: null
            })
        },
        ...extraGlobals
    });

    return { mainCtx, roomsCtx, elements };
}

describe('Imobiliária & Bloqueio do Pátio', () => {

    test('Imobiliária bloqueia compra com saldo < R$ 200 e realiza compra com saldo >= R$ 200', () => {
        const { mainCtx, roomsCtx, elements } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex');
        const buyPatio = roomsCtx.rooms.imobiliaria.subRooms.reformas.actions[0];

        engine.player.money = 199;
        buyPatio.execute(engine);

        assert.equal(engine.player.money, 199);
        assert.equal(engine.player.hasHouseUpgrade('patio'), false);
        assert.match(elements.get('log').innerHTML, /Dinheiro insuficiente/);

        engine.player.money = 250;
        const initialHour = engine.time.hour;
        buyPatio.execute(engine);

        assert.equal(engine.player.money, 50);
        assert.equal(engine.player.hasHouseUpgrade('patio'), true);
        assert.equal(engine.player.energy, 95);
        assert.equal(engine.time.hour, initialHour + 1);
    });

    test('changeLocation("casa", "patio") bloqueia acesso enquanto bloqueado e permite após desbloqueio', () => {
        const { mainCtx, elements } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex');

        engine.changeLocation('casa', 'patio');
        assert.equal(engine.currentEnvironment, 'casa');
        assert.equal(engine.currentSubRoom, 'quarto');
        assert.match(elements.get('log').innerHTML, /CÔMODO BLOQUEADO/);

        engine.player.unlockHouseUpgrade('patio');
        engine.changeLocation('casa', 'patio');
        assert.equal(engine.currentEnvironment, 'casa');
        assert.equal(engine.currentSubRoom, 'patio');
        assert.equal(elements.get('room-title').innerText, '🏠 Casa - Pátio');
    });

    test('changeLocation("imobiliaria") bloqueia às 08h e às 18h (fora do horário 09h-18h)', () => {
        const { mainCtx, elements } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex');
        engine.player.setClothes('casual');

        engine.time.hour = 8;
        engine.changeLocation('imobiliaria');
        assert.equal(engine.currentEnvironment, 'casa');
        assert.match(elements.get('log').innerHTML, /IMOBILIÁRIA FECHADA/);

        elements.get('log').innerHTML = '';
        engine.time.hour = 18;
        engine.changeLocation('imobiliaria');
        assert.equal(engine.currentEnvironment, 'casa');
        assert.match(elements.get('log').innerHTML, /IMOBILIÁRIA FECHADA/);
    });

    test('changeLocation("imobiliaria") bloqueia às 10h vestindo "pijama"', () => {
        const { mainCtx, elements } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex');

        engine.time.hour = 10;
        engine.player.setClothes('pijama');
        engine.changeLocation('imobiliaria');

        assert.equal(engine.currentEnvironment, 'casa');
        assert.match(elements.get('log').innerHTML, /ENTRADA PROIBIDA/);
    });

    test('changeLocation("imobiliaria") permite às 09h vestindo "casual"', () => {
        const { mainCtx } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex');

        engine.time.hour = 9;
        engine.player.setClothes('casual');
        engine.changeLocation('imobiliaria');

        assert.equal(engine.currentEnvironment, 'imobiliaria');
    });

    test('Imobiliária bloqueia compra da Piscina com saldo < R$ 1000 e conclui com saldo >= R$ 1000', () => {
        const { mainCtx, roomsCtx, elements } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex');
        const buyPiscina = roomsCtx.rooms.imobiliaria.subRooms.reformas.actions.find(
            a => a.upgradeId === 'piscina'
        );

        engine.player.money = 999;
        buyPiscina.execute(engine);

        assert.equal(engine.player.money, 999);
        assert.equal(engine.player.hasHouseUpgrade('piscina'), false);
        assert.match(elements.get('log').innerHTML, /Dinheiro insuficiente/);

        engine.player.money = 1200;
        const initialHour = engine.time.hour;
        buyPiscina.execute(engine);

        assert.equal(engine.player.money, 200);
        assert.equal(engine.player.hasHouseUpgrade('piscina'), true);
        assert.equal(engine.player.energy, 95);
        assert.equal(engine.time.hour, initialHour + 1);
    });

    test('changeLocation("casa", "piscina") bloqueado antes da compra e liberado após desbloqueio', () => {
        const { mainCtx, elements } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex');

        engine.changeLocation('casa', 'piscina');
        assert.equal(engine.currentEnvironment, 'casa');
        assert.equal(engine.currentSubRoom, 'quarto');
        assert.match(elements.get('log').innerHTML, /CÔMODO BLOQUEADO/);

        engine.player.unlockHouseUpgrade('piscina');
        engine.changeLocation('casa', 'piscina');
        assert.equal(engine.currentEnvironment, 'casa');
        assert.equal(engine.currentSubRoom, 'piscina');
        assert.equal(elements.get('room-title').innerText, '🏠 Casa - Piscina');
    });

    test('Ação "🏊 Nadar na Piscina" consome 20 de energia, avança 1h, soma +2 músculo e reduz -2 gordura', () => {
        const { mainCtx, roomsCtx } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex');
        const swimAction = roomsCtx.rooms.casa.subRooms.piscina.actions.find(
            a => a.label === '🏊 Nadar na Piscina'
        );

        const initialEnergy = engine.player.energy;
        const initialHour = engine.time.hour;
        const initialMuscle = engine.player.muscle;
        const initialFat = engine.player.fat;

        swimAction.execute(engine);

        assert.equal(engine.player.energy, initialEnergy - 20);
        assert.equal(engine.time.hour, initialHour + 1);
        assert.equal(engine.player.muscle, initialMuscle + 2);
        assert.equal(engine.player.fat, initialFat - 2);
    });
});

describe('Vestuário por ID e Flags de Ação', () => {
    test('Academia exige roupa "esporte" possuída e vestida', () => {
        const { mainCtx, elements } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex');
        engine.time.hour = 10;

        engine.player.setClothes('casual');
        engine.changeLocation('academia');
        assert.equal(engine.currentEnvironment, 'casa');
        assert.match(elements.get('log').innerHTML, /ENTRADA PROIBIDA/);

        elements.get('log').innerHTML = '';
        engine.player.setClothes('esporte');
        engine.changeLocation('academia');
        assert.equal(engine.currentEnvironment, 'casa');
        assert.match(elements.get('log').innerHTML, /ENTRADA PROIBIDA/);

        engine.player.buyOutfit('esporte');
        engine.changeLocation('academia');
        assert.equal(engine.currentEnvironment, 'academia');
    });

    test('Trabalho aceita apenas IDs "casual", "terno" e "trabalho_pesado"', () => {
        const { mainCtx, elements } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex');
        engine.time.hour = 10;

        for (const blocked of ['pijama', 'esporte']) {
            elements.get('log').innerHTML = '';
            engine.changeLocation('casa', 'quarto');
            engine.player.setClothes(blocked);
            engine.changeLocation('trabalho');
            assert.equal(engine.currentEnvironment, 'casa');
            assert.match(elements.get('log').innerHTML, /DRESS CODE RECUSADO/);
        }

        for (const allowed of ['casual', 'terno', 'trabalho_pesado']) {
            engine.changeLocation('casa', 'quarto');
            engine.player.setClothes(allowed);
            engine.changeLocation('trabalho');
            assert.equal(engine.currentEnvironment, 'trabalho');
        }
    });

    test('renderActions no Trabalho desabilita ação com requiresPendingTasks quando taskQueue === 0', () => {
        const { mainCtx, elements } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex');
        engine.time.hour = 10;
        engine.player.setClothes('casual');
        engine.player.isEmployed = true;
        engine.player.taskQueue = 0;

        engine.changeLocation('trabalho', 'escritorio');
        const actionsWhenEmpty = elements.get('actions').children;
        const taskBtnEmpty = actionsWhenEmpty.find(b => b.innerText.includes('Executar Tarefa'));
        assert.ok(taskBtnEmpty);
        assert.equal(taskBtnEmpty.disabled, true);
        assert.match(taskBtnEmpty.innerText, /\[Sem Tarefas\]/);

        engine.player.taskQueue = 2;
        engine.renderActions();
        const actionsWhenPending = elements.get('actions').children;
        const taskBtnPending = actionsWhenPending.find(b => b.innerText.includes('Executar Tarefa'));
        assert.ok(taskBtnPending);
        assert.equal(taskBtnPending.disabled, false);
        assert.doesNotMatch(taskBtnPending.innerText, /\[Sem Tarefas\]/);
    });
});

describe('Aumento de Aluguel por Reformas', () => {
    test('comprar patio e piscina na Imobiliária aumenta rentCost de 150 para 200 e 300', () => {
        const { mainCtx, roomsCtx } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex');
        const reformas = roomsCtx.rooms.imobiliaria.subRooms.reformas.actions;
        const buyPatio = reformas.find(a => a.upgradeId === 'patio');
        const buyPiscina = reformas.find(a => a.upgradeId === 'piscina');

        assert.equal(engine.time.rentCost, 150);

        engine.player.money = 1500;
        buyPatio.execute(engine);
        assert.equal(engine.time.rentCost, 200);

        buyPiscina.execute(engine);
        assert.equal(engine.time.rentCost, 300);
    });

    test('dia do aluguel (day % 7 === 0) cobra o rentCost atualizado e aplica Game Over quando insuficiente', () => {
        const { mainCtx, roomsCtx, elements } = setupGameContext();
        const buyPatio = roomsCtx.rooms.imobiliaria.subRooms.reformas.actions.find(
            a => a.upgradeId === 'patio'
        );

        const evictedEngine = new mainCtx.GameEngine('Alex');
        evictedEngine.player.money = 500;
        buyPatio.execute(evictedEngine);
        evictedEngine.time.day = 6;
        evictedEngine.time.hour = 23;
        evictedEngine.player.money = 199;
        evictedEngine.time.advanceTime(1, evictedEngine);

        assert.equal(evictedEngine.isGameOver, true);
        assert.equal(evictedEngine.player.money, 199);
        assert.match(elements.get('gameover-reason').innerText, /R\$ 200.*Dia 7/);

        elements.get('log').innerHTML = '';
        const paidEngine = new mainCtx.GameEngine('Alex');
        paidEngine.player.money = 500;
        buyPatio.execute(paidEngine);
        paidEngine.time.day = 6;
        paidEngine.time.hour = 23;
        paidEngine.player.money = 200;
        paidEngine.time.advanceTime(1, paidEngine);

        assert.equal(paidEngine.isGameOver, false);
        assert.equal(paidEngine.player.money, 0);
        assert.match(elements.get('log').innerHTML, /ALUGUEL PAGO!.*R\$ 200/);
    });

    test('GameEngine.fromSave recalcula rentCost a partir de player.houseUpgrades', () => {
        const { mainCtx } = setupGameContext();
        const engine = mainCtx.GameEngine.fromSave({
            player: {
                name: 'Alex',
                gender: 'masculino',
                energy: 80,
                maxEnergy: 100,
                hunger: 10,
                money: 500,
                clothes: 'casual',
                fat: 30,
                muscle: 40,
                isEmployed: false,
                taskQueue: 0,
                houseUpgrades: { patio: true, piscina: true }
            },
            time: { day: 3, hour: 12, minute: 0 },
            ownedOutfits: ['pijama', 'casual'],
            foodStock: {},
            location: { currentEnvironment: 'casa', currentSubRoom: 'quarto' }
        });

        assert.equal(engine.time.rentCost, 300);
    });

    test('updateUI atualiza #t-rent-cost com o valor de rentCost', () => {
        const { mainCtx, roomsCtx, elements } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex');
        const buyPatio = roomsCtx.rooms.imobiliaria.subRooms.reformas.actions.find(
            a => a.upgradeId === 'patio'
        );

        engine.updateUI();
        assert.equal(elements.get('t-rent-cost').innerText, 150);

        engine.player.money = 300;
        buyPatio.execute(engine);
        assert.equal(elements.get('t-rent-cost').innerText, 200);
    });
});

describe('Pet Shop', () => {
    test('changeLocation("petshop") bloqueia às 08h e às 18h (fora do horário 09h-18h)', () => {
        const { mainCtx, elements } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex');
        engine.player.setClothes('casual');

        engine.time.hour = 8;
        engine.changeLocation('petshop');
        assert.equal(engine.currentEnvironment, 'casa');
        assert.match(elements.get('log').innerHTML, /PET SHOP FECHADO/);

        elements.get('log').innerHTML = '';
        engine.time.hour = 18;
        engine.changeLocation('petshop');
        assert.equal(engine.currentEnvironment, 'casa');
        assert.match(elements.get('log').innerHTML, /PET SHOP FECHADO/);
    });

    test('changeLocation("petshop") bloqueia às 10h vestindo roupa inadequada ("pijama")', () => {
        const { mainCtx, elements } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex');

        engine.time.hour = 10;
        engine.player.setClothes('pijama');
        engine.changeLocation('petshop');

        assert.equal(engine.currentEnvironment, 'casa');
        assert.match(elements.get('log').innerHTML, /ENTRADA PROIBIDA/);
    });

    test('changeLocation("petshop") permite entrar entre 09h e 17h59 vestindo "casual" e atualiza #room-title', () => {
        const { mainCtx, elements } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex');

        engine.time.hour = 9;
        engine.player.setClothes('casual');
        engine.changeLocation('petshop');

        assert.equal(engine.currentEnvironment, 'petshop');
        assert.equal(elements.get('room-title').innerText, '🐾 Pet Shop - Balcão');
    });

    test('petshop possui os 4 sub-ambientes: balcao, vitrine, loja e banho_tosa', () => {
        const { roomsCtx } = setupGameContext();
        assert.deepEqual(
            Object.keys(roomsCtx.rooms.petshop.subRooms),
            ['balcao', 'vitrine', 'loja', 'banho_tosa']
        );
    });

    test('balcao: brincar com os filhotinhos consome 10 de energia e avança 1h', () => {
        const { mainCtx, roomsCtx } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex');
        const playAction = roomsCtx.rooms.petshop.subRooms.balcao.actions[0];

        const initialHour = engine.time.hour;
        playAction.execute(engine);

        assert.equal(engine.player.energy, 90);
        assert.equal(engine.time.hour, initialHour + 1);
    });

    test('vitrine: adota cachorro ou gato com nome personalizado, bloqueia sem saldo e bloqueia segundo pet', () => {
        const promptNames = ['Thor', 'Luna'];
        const { mainCtx, roomsCtx, elements } = setupGameContext({
            prompt: () => promptNames.shift() || ''
        });
        const engine = new mainCtx.GameEngine('Alex');
        const [adoptDog, adoptCat] = roomsCtx.rooms.petshop.subRooms.vitrine.actions;

        engine.player.money = 200;
        adoptDog.execute(engine);
        assert.equal(engine.player.pet, null);
        assert.match(elements.get('log').innerHTML, /Dinheiro insuficiente/);

        engine.player.money = 600;
        adoptDog.execute(engine);
        assert.equal(engine.player.money, 300);
        assert.equal(engine.player.pet.type, 'Cachorro');
        assert.equal(engine.player.pet.name, 'Thor');

        adoptCat.execute(engine);
        assert.equal(engine.player.money, 300);
        assert.equal(engine.player.pet.type, 'Cachorro');
        assert.match(elements.get('log').innerHTML, /já possui um pet/);

        const catContext = setupGameContext({ prompt: () => 'Mimi' });
        const catEngine = new catContext.mainCtx.GameEngine('Alex');
        catEngine.player.money = 300;
        catContext.roomsCtx.rooms.petshop.subRooms.vitrine.actions[1].execute(catEngine);
        assert.equal(catEngine.player.money, 50);
        assert.equal(catEngine.player.pet.type, 'Gato');
        assert.equal(catEngine.player.pet.name, 'Mimi');
    });

    test('loja: bloqueia sem pet e permite comprar ração, roupa e acessório após adoção', () => {
        const { mainCtx, roomsCtx, elements } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex');
        const [buyFood, buyOutfit, buyAccessory] = roomsCtx.rooms.petshop.subRooms.loja.actions;

        engine.player.money = 200;
        buyFood.execute(engine);
        assert.equal(engine.player.money, 200);
        assert.match(elements.get('log').innerHTML, /precisa adotar um pet/);

        engine.player.adoptPet('Cachorro', 'Rex');
        buyFood.execute(engine);
        buyOutfit.execute(engine);
        buyAccessory.execute(engine);

        assert.equal(engine.player.money, 75);
        assert.equal(engine.player.pet.foodStock, 1);
        assert.equal(engine.player.pet.outfit, 'Colete Pet');
        assert.equal(engine.player.pet.accessory, 'Coleira Estilosa');
    });

    test('banho_tosa: bloqueia sem pet e aumenta higiene e felicidade (clamped 0-100) com pet adotado', () => {
        const { mainCtx, roomsCtx, elements } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex');
        const bathAction = roomsCtx.rooms.petshop.subRooms.banho_tosa.actions[0];

        engine.player.money = 100;
        bathAction.execute(engine);
        assert.equal(engine.player.money, 100);
        assert.match(elements.get('log').innerHTML, /precisa ter um pet/);

        engine.player.adoptPet('Gato', 'Mimi');
        engine.player.pet.hygiene = 80;
        engine.player.pet.happiness = 95;
        const initialHour = engine.time.hour;

        bathAction.execute(engine);

        assert.equal(engine.player.money, 60);
        assert.equal(engine.time.hour, initialHour + 1);
        assert.equal(engine.player.pet.hygiene, 100);
        assert.equal(engine.player.pet.happiness, 100);
    });

    test('painel #pet-status-panel, renamePet, feedPet e desgaste proporcional em advanceTime', () => {
        const { mainCtx, elements } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex');

        assert.equal(elements.get('pet-status-panel').style.display, 'none');

        engine.player.adoptPet('Cachorro', 'Bolinha');
        engine.updateUI();

        assert.equal(elements.get('pet-status-panel').style.display, 'block');
        assert.equal(elements.get('pet-name').innerText, 'Cachorro - Bolinha');
        assert.equal(elements.get('pet-energy-bar').value, 100);
        assert.equal(elements.get('pet-energy-val').innerText, 100);
        assert.equal(elements.get('pet-hunger-bar').value, 0);
        assert.equal(elements.get('pet-hunger-val').innerText, 0);
        assert.equal(elements.get('pet-hygiene-bar').value, 100);
        assert.equal(elements.get('pet-hygiene-val').innerText, 100);
        assert.equal(elements.get('pet-happiness-bar').value, 100);
        assert.equal(elements.get('pet-happiness-val').innerText, 100);

        engine.renamePet('Thor');
        assert.equal(engine.player.pet.name, 'Thor');
        assert.equal(elements.get('pet-name').innerText, 'Cachorro - Thor');

        engine.time.advanceTime(5, engine);
        assert.equal(engine.player.pet.hunger, 10);
        assert.equal(engine.player.pet.energy, 95);
        assert.equal(engine.player.pet.hygiene, 95);
        assert.equal(engine.player.pet.happiness, 95);

        engine.feedPet();
        assert.match(elements.get('log').innerHTML, /não tem ração/);

        engine.player.pet.foodStock = 2;
        engine.player.pet.hunger = 40;
        engine.player.pet.happiness = 80;
        engine.feedPet();

        assert.equal(engine.player.pet.foodStock, 1);
        assert.equal(engine.player.pet.hunger, 10);
        assert.equal(engine.player.pet.happiness, 85);
        assert.equal(elements.get('pet-hunger-bar').value, 10);
        assert.equal(elements.get('pet-happiness-val').innerText, 85);
    });

    test('Save/Load (exportSaveState e GameEngine.fromSave) preserva player.pet', () => {
        const saveCtx = loadScript(path.resolve('scripts/save.js'), { btoa, atob });
        const { mainCtx, elements } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex');

        engine.player.adoptPet('Gato', 'Mimi');
        engine.player.pet.energy = 72;
        engine.player.pet.hunger = 28;
        engine.player.pet.hygiene = 64;
        engine.player.pet.happiness = 88;
        engine.player.pet.foodStock = 3;
        engine.player.pet.outfit = 'Colete Pet';
        engine.player.pet.accessory = 'Coleira Estilosa';

        const code = saveCtx.exportSaveState(engine, [], { comida: [] });
        const saveData = saveCtx.importSaveState(code);
        const restored = mainCtx.GameEngine.fromSave(saveData);

        assert.deepEqual(structuredClone(restored.player.pet), {
            type: 'Gato',
            name: 'Mimi',
            energy: 72,
            hunger: 28,
            hygiene: 64,
            happiness: 88,
            foodStock: 3,
            outfit: 'Colete Pet',
            accessory: 'Coleira Estilosa'
        });
        assert.equal(elements.get('pet-status-panel').style.display, 'block');
        assert.equal(elements.get('pet-name').innerText, 'Gato - Mimi');
    });
});

describe('Interações com o Pet (Sala e Pátio)', () => {
    test('renderActions na sala e no patio oculta ações de pet sem pet e desabilita com " - [Pet Sem Energia]" quando pet.energy < petEnergyCost', () => {
        const { mainCtx, elements } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex');
        engine.player.unlockHouseUpgrade('patio');

        // Sem pet na sala
        engine.changeLocation('casa', 'sala');
        let buttons = elements.get('actions').children;
        assert.equal(buttons.some(b => b.innerText.includes('🐾 Fazer Carinho no Pet')), false);

        // Sem pet no patio
        engine.changeLocation('casa', 'patio');
        buttons = elements.get('actions').children;
        assert.equal(buttons.some(b => b.innerText.includes('🎾 Brincar com o Pet')), false);

        // Com pet adotado e energia suficiente
        engine.player.adoptPet('Cachorro', 'Rex');
        engine.changeLocation('casa', 'sala');
        let petBtn = elements.get('actions').children.find(b => b.innerText.includes('🐾 Fazer Carinho no Pet'));
        assert.ok(petBtn);
        assert.equal(petBtn.disabled, false);

        engine.changeLocation('casa', 'patio');
        let playBtn = elements.get('actions').children.find(b => b.innerText.includes('🎾 Brincar com o Pet'));
        assert.ok(playBtn);
        assert.equal(playBtn.disabled, false);

        // Com pet.energy < petEnergyCost (5 na sala, 15 no patio)
        engine.player.pet.energy = 4;
        engine.changeLocation('casa', 'sala');
        petBtn = elements.get('actions').children.find(b => b.innerText.includes('🐾 Fazer Carinho no Pet'));
        assert.ok(petBtn);
        assert.equal(petBtn.disabled, true);
        assert.match(petBtn.innerText, / - \[Pet Sem Energia\]$/);

        engine.player.pet.energy = 14;
        engine.changeLocation('casa', 'patio');
        playBtn = elements.get('actions').children.find(b => b.innerText.includes('🎾 Brincar com o Pet'));
        assert.ok(playBtn);
        assert.equal(playBtn.disabled, true);
        assert.match(playBtn.innerText, / - \[Pet Sem Energia\]$/);
    });

    test('🐾 Fazer Carinho no Pet na sala consome energia, avança 0.5h, aumenta felicidade e bloqueia sem energia', () => {
        const { mainCtx, roomsCtx, elements } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex');
        const petAction = roomsCtx.rooms.casa.subRooms.sala.actions.find(
            a => a.label === '🐾 Fazer Carinho no Pet'
        );
        assert.ok(petAction);

        engine.player.adoptPet('Gato', 'Mimi');
        engine.player.energy = 80;
        engine.player.pet.energy = 60;
        engine.player.pet.happiness = 50;
        engine.time.hour = 9;
        engine.time.minute = 0;

        petAction.execute(engine);

        assert.equal(engine.player.energy, 75);
        assert.equal(engine.time.hour, 9);
        assert.equal(engine.time.minute, 30);
        // advanceTime(0.5): pet.energy -0.5 e pet.happiness -0.5; interação: -5 energia, +15 felicidade
        assert.equal(engine.player.pet.energy, 54.5);
        assert.equal(engine.player.pet.happiness, 64.5);

        // Bloqueia sem alteração de estado se jogador não tiver energia suficiente
        engine.player.energy = 4;
        petAction.execute(engine);
        assert.equal(engine.player.energy, 4);
        assert.equal(engine.time.hour, 9);
        assert.equal(engine.time.minute, 30);
        assert.equal(engine.player.pet.energy, 54.5);
        assert.equal(engine.player.pet.happiness, 64.5);
        assert.match(elements.get('log').innerHTML, /Energia insuficiente/);

        // Bloqueia sem alteração de estado se pet não tiver energia suficiente
        engine.player.energy = 50;
        engine.player.pet.energy = 4;
        petAction.execute(engine);
        assert.equal(engine.player.energy, 50);
        assert.equal(engine.time.hour, 9);
        assert.equal(engine.time.minute, 30);
        assert.equal(engine.player.pet.energy, 4);
        assert.equal(engine.player.pet.happiness, 64.5);
        assert.match(elements.get('log').innerHTML, /está sem energia/);
    });

    test('🎾 Brincar com o Pet no patio exige patio desbloqueado e pet adotado, consome energia, avança 1h e aumenta felicidade', () => {
        const { mainCtx, roomsCtx, elements } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex');
        const playAction = roomsCtx.rooms.casa.subRooms.patio.actions.find(
            a => a.label === '🎾 Brincar com o Pet'
        );
        assert.ok(playAction);

        // Sem patio desbloqueado: acesso ao pátio bloqueado
        engine.changeLocation('casa', 'patio');
        assert.equal(engine.currentSubRoom, 'quarto');

        // Com patio desbloqueado, mas sem pet: bloqueia execução
        engine.player.unlockHouseUpgrade('patio');
        engine.changeLocation('casa', 'patio');
        assert.equal(engine.currentSubRoom, 'patio');
        engine.player.energy = 80;
        engine.time.hour = 10;
        playAction.execute(engine);
        assert.equal(engine.player.energy, 80);
        assert.equal(engine.time.hour, 10);
        assert.match(elements.get('log').innerHTML, /precisa adotar um pet/);

        // Com patio desbloqueado e pet adotado
        engine.player.adoptPet('Cachorro', 'Thor');
        engine.player.pet.energy = 70;
        engine.player.pet.happiness = 50;

        playAction.execute(engine);

        assert.equal(engine.player.energy, 65);
        assert.equal(engine.time.hour, 11);
        assert.equal(engine.time.minute, 0);
        // advanceTime(1): pet.energy -1 e pet.happiness -1; interação: -15 energia, +25 felicidade
        assert.equal(engine.player.pet.energy, 54);
        assert.equal(engine.player.pet.happiness, 74);
    });

    test('passagem de dia restaura a energia do pet', () => {
        const { mainCtx } = setupGameContext();
        const engine = new mainCtx.GameEngine('Ana', 'feminino');

        engine.player.adoptPet('Cachorro', 'Rex');
        engine.player.pet.energy = 0;
        engine.time.hour = 23;
        engine.time.minute = 0;

        engine.time.advanceTime(2, engine);

        assert.equal(engine.time.day, 2);
        assert.equal(engine.player.pet.energy, 98);
    });

    test('log converte **texto** em <strong>texto</strong> sem manter asteriscos', () => {
        const { mainCtx, elements } = setupGameContext();
        const engine = new mainCtx.GameEngine('Ana', 'feminino');

        engine.log('🍖 Você alimentou **Rex**! (**Bônus**)');

        const html = elements.get('log').innerHTML;
        assert.match(html, /<strong>Rex<\/strong>/);
        assert.match(html, /<strong>Bônus<\/strong>/);
        assert.doesNotMatch(html, /\*\*/);
    });

    test('log insere mensagens mais recentes no topo', () => {
        const { mainCtx, elements } = setupGameContext();
        const engine = new mainCtx.GameEngine('Ana', 'feminino');

        engine.log('Primeira mensagem');
        engine.log('Segunda mensagem');

        const html = elements.get('log').innerHTML;
        assert.ok(html.indexOf('Segunda mensagem') < html.indexOf('Primeira mensagem'));
        assert.equal(elements.get('log').scrollTop, 0);
    });
});

describe('Cabeleireiro', () => {
    test('banheiro não possui mais a ação "🪞 Mudar Cabelo"', () => {
        const { roomsCtx } = setupGameContext();
        const hairAction = roomsCtx.rooms.casa.subRooms.banheiro.actions.find(
            a => a.label === '🪞 Mudar Cabelo'
        );
        assert.equal(hairAction, undefined);
    });

    test('changeLocation("cabeleireiro") bloqueia fora do horário (08h e 18h)', () => {
        const { mainCtx, elements } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex');
        engine.player.clothes = 'casual';

        engine.time.hour = 8;
        engine.changeLocation('cabeleireiro');
        assert.equal(engine.currentEnvironment, 'casa');
        assert.match(elements.get('log').innerHTML, /CABELEIREIRO FECHADO/);

        engine.time.hour = 18;
        engine.changeLocation('cabeleireiro');
        assert.equal(engine.currentEnvironment, 'casa');
        assert.match(elements.get('log').innerHTML, /CABELEIREIRO FECHADO/);
    });

    test('changeLocation("cabeleireiro") bloqueia às 10h vestindo roupa inadequada ("pijama")', () => {
        const { mainCtx, elements } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex');
        engine.time.hour = 10;
        engine.player.clothes = 'pijama';

        engine.changeLocation('cabeleireiro');
        assert.equal(engine.currentEnvironment, 'casa');
        assert.match(elements.get('log').innerHTML, /ENTRADA PROIBIDA/);
    });

    test('estabelecimentos comerciais bloqueiam "pijama" e "praia" (cabeleireiro, mercado, imobiliaria, petshop)', () => {
        for (const env of ['cabeleireiro', 'mercado', 'imobiliaria', 'petshop']) {
            for (const outfit of ['pijama', 'praia']) {
                const { mainCtx, elements } = setupGameContext();
                const engine = new mainCtx.GameEngine('Alex');
                engine.time.hour = 10;
                engine.player.clothes = outfit;

                engine.changeLocation(env);
                assert.equal(engine.currentEnvironment, 'casa', `${env} deveria bloquear ${outfit}`);
                assert.match(elements.get('log').innerHTML, /ENTRADA PROIBIDA/);
            }
        }
    });

    test('changeLocation("cabeleireiro") permite entrar entre 09h e 17h59 vestindo "casual" e atualiza #room-title', () => {
        const { mainCtx, roomsCtx, elements } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex');
        engine.player.clothes = 'casual';
        engine.time.hour = 9;

        engine.changeLocation('cabeleireiro');
        assert.equal(engine.currentEnvironment, 'cabeleireiro');
        assert.equal(engine.currentSubRoom, 'corte');
        assert.equal(elements.get('room-title').innerText, '💇 Cabeleireiro - Corte de Cabelo');
        assert.deepEqual(Object.keys(roomsCtx.rooms.cabeleireiro.subRooms), ['corte', 'tintura']);
    });

    test('sub-ambiente corte bloqueia estilo atual, saldo < R$ 40, trata desistência e aplica corte no sucesso mantendo hairColor', () => {
        let nextResult = [true, false];
        const calls = [];
        const { mainCtx, roomsCtx, elements } = setupGameContext({
            minigame: {
                openHaircutGame(targetStyle, hairColor, cb) {
                    calls.push({ targetStyle, hairColor });
                    cb(...nextResult);
                }
            }
        });
        const engine = new mainCtx.GameEngine('Alex', 'masculino', null, {
            hairStyle: 'curto',
            hairColor: 'castanho'
        });
        engine.time.hour = 10;

        const sameCut = roomsCtx.rooms.cabeleireiro.subRooms.corte.actions.find(
            a => a.label.includes('Curto')
        );
        const longCut = roomsCtx.rooms.cabeleireiro.subRooms.corte.actions.find(
            a => a.label.includes('Longo')
        );
        assert.ok(sameCut);
        assert.ok(longCut);

        engine.player.money = 100;
        sameCut.execute(engine);
        assert.equal(calls.length, 0);
        assert.equal(engine.player.money, 100);
        assert.equal(engine.time.hour, 10);
        assert.equal(engine.player.hairStyle, 'curto');
        assert.match(elements.get('log').innerHTML, /já está com esse visual/);

        engine.player.money = 39;
        longCut.execute(engine);
        assert.equal(calls.length, 0);
        assert.equal(engine.player.money, 39);
        assert.equal(engine.time.hour, 10);
        assert.equal(engine.player.hairStyle, 'curto');
        assert.match(elements.get('log').innerHTML, /Dinheiro insuficiente/);

        engine.player.money = 40;
        nextResult = [false, true];
        longCut.execute(engine);
        assert.equal(calls.length, 1);
        assert.deepEqual(calls[0], { targetStyle: 'longo', hairColor: 'castanho' });
        assert.equal(engine.player.money, 40);
        assert.equal(engine.time.hour, 10);
        assert.equal(engine.player.hairStyle, 'curto');
        assert.match(elements.get('log').innerHTML, /desistiu do corte/);

        nextResult = [true, false];
        longCut.execute(engine);
        assert.equal(calls.length, 2);
        assert.deepEqual(calls[1], { targetStyle: 'longo', hairColor: 'castanho' });
        assert.equal(engine.player.money, 0);
        assert.equal(engine.time.hour, 11);
        assert.equal(engine.player.hairStyle, 'longo');
        assert.equal(engine.player.hairColor, 'castanho');
    });

    test('sub-ambiente tintura bloqueia cor atual, saldo < R$ 50, e aplica cor com saldo >= R$ 50 mantendo hairStyle', () => {
        const { mainCtx, roomsCtx, elements } = setupGameContext();
        const engine = new mainCtx.GameEngine('Alex', 'masculino', null, {
            hairStyle: 'longo',
            hairColor: 'castanho'
        });
        engine.time.hour = 11;

        const sameColor = roomsCtx.rooms.cabeleireiro.subRooms.tintura.actions.find(
            a => a.label.includes('Castanho')
        );
        const blondeColor = roomsCtx.rooms.cabeleireiro.subRooms.tintura.actions.find(
            a => a.label.includes('Loiro')
        );
        assert.ok(sameColor);
        assert.ok(blondeColor);

        engine.player.money = 100;
        sameColor.execute(engine);
        assert.equal(engine.player.money, 100);
        assert.equal(engine.time.hour, 11);
        assert.equal(engine.player.hairColor, 'castanho');
        assert.match(elements.get('log').innerHTML, /já está com esse visual/);

        engine.player.money = 49;
        blondeColor.execute(engine);
        assert.equal(engine.player.money, 49);
        assert.equal(engine.time.hour, 11);
        assert.equal(engine.player.hairColor, 'castanho');
        assert.match(elements.get('log').innerHTML, /Dinheiro insuficiente/);

        engine.player.money = 50;
        blondeColor.execute(engine);
        assert.equal(engine.player.money, 0);
        assert.equal(engine.time.hour, 12);
        assert.equal(engine.player.hairColor, 'loiro');
        assert.equal(engine.player.hairStyle, 'longo');
    });
});

function setupHaircutMinigameContext() {
    const moves = [];
    const lines = [];
    const lineDashes = [];
    const strokeStyles = [];
    const listeners = {};
    let currentStrokeStyle = '';

    const ctx = {
        lineWidth: 0,
        lineCap: '',
        get strokeStyle() {
            return currentStrokeStyle;
        },
        set strokeStyle(val) {
            currentStrokeStyle = val;
            strokeStyles.push(val);
        },
        clearRect() {},
        beginPath() {},
        moveTo(x, y) {
            moves.push({ x, y });
        },
        lineTo(x, y) {
            lines.push({ x, y, strokeStyle: currentStrokeStyle });
        },
        stroke() {},
        save() {},
        restore() {},
        setLineDash(dash) {
            lineDashes.push({ dash, moveIdx: moves.length, lineIdx: lines.length });
        }
    };

    const canvas = {
        width: 300,
        height: 220,
        getContext: () => ctx,
        getBoundingClientRect: () => ({ left: 0, top: 0 }),
        addEventListener: (event, fn) => {
            listeners[event] = fn;
        },
        removeEventListener: (event, fn) => {
            if (listeners[event] === fn) delete listeners[event];
        }
    };

    const elements = new Map([['haircut-canvas', canvas]]);
    const getEl = (id) => {
        if (!elements.has(id)) {
            elements.set(id, { id, innerText: '', innerHTML: '', style: {} });
        }
        return elements.get(id);
    };

    const minigamesCtx = loadScript(path.resolve('scripts/minigames.js'), {
        document: { getElementById: getEl }
    });

    return { minigamesCtx, moves, lines, lineDashes, strokeStyles, listeners };
}

describe('Minigame de Corte de Cabelo', () => {
    test('desenha linha tracejada horizontal em y crescente para curto (65) < medio (115) < longo (170)', () => {
        const yByStyle = {};

        for (const style of ['curto', 'medio', 'longo']) {
            const { minigamesCtx, moves, lines, lineDashes } = setupHaircutMinigameContext();
            minigamesCtx.minigame.openHaircutGame(style, 'castanho', () => {});

            assert.equal(lineDashes.length, 1);
            assert.deepEqual(Array.from(lineDashes[0].dash), [8, 6]);
            const start = moves[lineDashes[0].moveIdx];
            const end = lines[lineDashes[0].lineIdx];
            assert.equal(start.x, 0);
            assert.equal(end.x, 300);
            assert.equal(start.y, end.y);
            yByStyle[style] = start.y;
        }

        assert.equal(yByStyle.curto, 65);
        assert.equal(yByStyle.medio, 115);
        assert.equal(yByStyle.longo, 170);
        assert.ok(yByStyle.curto < yByStyle.medio && yByStyle.medio < yByStyle.longo);
    });

    test('usa strokeStyle correspondente ao hairColor do personagem', () => {
        const blonde = setupHaircutMinigameContext();
        blonde.minigamesCtx.minigame.openHaircutGame('medio', 'loiro', () => {});
        assert.ok(blonde.strokeStyles.includes('#e6c24a'));

        const red = setupHaircutMinigameContext();
        red.minigamesCtx.minigame.openHaircutGame('medio', 'ruivo', () => {});
        assert.ok(red.strokeStyles.includes('#c04d26'));
    });

    test('desenha fios ondulados para cacheado e fios lisos para curto/longo', () => {
        const curly = setupHaircutMinigameContext();
        curly.minigamesCtx.minigame.openHaircutGame('cacheado', 'castanho', () => {});
        const curlyHairLines = curly.lines.filter(l => l.strokeStyle !== '#f1c40f');
        assert.ok(curlyHairLines.length > 40);
        assert.ok(new Set(curlyHairLines.map(l => l.x)).size > 40);

        for (const style of ['curto', 'longo']) {
            const straight = setupHaircutMinigameContext();
            straight.minigamesCtx.minigame.openHaircutGame(style, 'castanho', () => {});
            const straightHairLines = straight.lines.filter(l => l.strokeStyle !== '#f1c40f');
            assert.equal(straightHairLines.length, 40);
        }
    });

    test('arraste horizontal ao longo de cutY conclui minigame via finishTask(true) e botão aciona callback (true, false)', () => {
        const { minigamesCtx, listeners } = setupHaircutMinigameContext();
        const finishCalls = [];
        const originalFinishTask = minigamesCtx.minigame.finishTask.bind(minigamesCtx.minigame);
        minigamesCtx.minigame.finishTask = (success, message) => {
            finishCalls.push({ success, message });
            return originalFinishTask(success, message);
        };

        const callbackCalls = [];
        minigamesCtx.minigame.openHaircutGame('medio', 'loiro', (success, canceled) => {
            callbackCalls.push({ success, canceled });
        });

        const cutY = 115;
        const noop = () => {};
        listeners.mousedown({ clientX: 5, clientY: cutY, preventDefault: noop });
        for (let x = 20; x < 300; x += 15) {
            if (!listeners.mousemove) break;
            listeners.mousemove({ clientX: x, clientY: cutY, preventDefault: noop });
        }

        assert.equal(finishCalls.length, 1);
        assert.equal(finishCalls[0].success, true);
        assert.equal(minigamesCtx.minigame.isCompleted, true);
        assert.equal(callbackCalls.length, 0);

        minigamesCtx.minigame.handleModalButtonClick();
        assert.deepEqual(callbackCalls, [{ success: true, canceled: false }]);
    });
});



