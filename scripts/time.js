// ==========================================
// SISTEMA DE TEMPO
// ==========================================
class TimeSystem {
    constructor() {
        this.day = 1;
        this.hour = 8;
        this.minute = 0; // Novo controle explícito de minutos
        this.rentInterval = 7;
        this.baseRentCost = 150;
        this.rentCost = this.baseRentCost;
    }

    updateRentCost(player) {
        const upgradeIncreases = { patio: 50, piscina: 100 };
        let extra = 0;
        for (const [id, increase] of Object.entries(upgradeIncreases)) {
            if (player.hasHouseUpgrade(id)) extra += increase;
        }
        this.rentCost = this.baseRentCost + extra;
    }

    // O parâmetro 'hours' pode receber frações como 0.5 (30 min) ou 1, 2, etc.
    advanceTime(hours, gameEngine) {
        const totalMinutesToAdd = Math.round(hours * 60);
        
        let currentTotalMinutes = (this.hour * 60) + this.minute + totalMinutesToAdd;
        
        if (currentTotalMinutes >= 1440) { // 1440 minutos = 24 horas
            const extraDays = Math.floor(currentTotalMinutes / 1440);
            currentTotalMinutes = currentTotalMinutes % 1440;
            
            for (let i = 0; i < extraDays; i++) {
                this.day += 1;
                this.onNewDay(gameEngine);
            }
        }

        this.hour = Math.floor(currentTotalMinutes / 60);
        this.minute = currentTotalMinutes % 60;

        // Fome escala proporcionalmente com o tempo total em horas
        gameEngine.player.modifyHunger(2 * hours);
        if (gameEngine.player.pet) {
            gameEngine.player.modifyPetStat("hunger", 2 * hours);
            gameEngine.player.modifyPetStat("energy", -1 * hours);
            gameEngine.player.modifyPetStat("hygiene", -1 * hours);
            gameEngine.player.modifyPetStat("happiness", -1 * hours);
        }
        gameEngine.checkStatusConditions();
    }

    // Método para dormir e acordar às 8h da manhã do dia seguinte
    sleepUntilNextMorning(targetHour = 8, game) {
        let hoursToAdvance = 0;

        // Se já passou ou está na hora alvo, calcula o tempo até o dia seguinte
        if (this.hour >= targetHour) {
            hoursToAdvance = (24 - this.hour) + targetHour;
        } else {
            // Se for de madrugada antes das 8h
            hoursToAdvance = targetHour - this.hour;
        }

        // Avança o tempo usando a sua lógica existente de avanço de horas/dias
        this.advanceTime(hoursToAdvance, game);
        if (game.player.pet) {
            game.player.modifyPetStat("energy", 100);
        }
    }

    onNewDay(gameEngine) {
        if (this.day % this.rentInterval === 0) {
            if (gameEngine.player.money >= this.rentCost) {
                gameEngine.player.money -= this.rentCost;
                gameEngine.log(`💸 **ALUGUEL PAGO!** R$ ${this.rentCost} foram descontados do seu saldo.`);
            } else {
                gameEngine.triggerGameOver(`Você não tinha R$ ${this.rentCost} para pagar o aluguel no Dia ${this.day} e foi despejado!`);
                return;
            }
        }

        if (gameEngine.player.pet) {
            gameEngine.player.modifyPetStat("energy", 100);
        }

        if (gameEngine.player.isEmployed) {
            const newTasks = Math.floor(Math.random() * 3) + 1;
            gameEngine.player.taskQueue += newTasks;
            gameEngine.log(`📥 Início do Dia ${this.day}: Chegaram ${newTasks} novas tarefas no trabalho!`);
            gameEngine.checkJobStatus();
        }
    }

    getNextRentDay() {
        return Math.ceil(this.day / this.rentInterval) * this.rentInterval;
    }
}