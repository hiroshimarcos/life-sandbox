const HAIR_COLOR_HEX = {
    preto: "#1c1c1c",
    castanho: "#6b4226",
    loiro: "#e6c24a",
    ruivo: "#c04d26",
    grisalho: "#9ea7ad",
    colorido: "#e84393"
};

const HAIRCUT_CUT_Y = {
    careca: 35,
    curto: 65,
    medio: 115,
    longo: 170,
    cacheado: 115,
    crespo: 95
};

// ==========================================
// GERENCIADOR DE MINIJOGOS
// ==========================================
class MinigameManager {
    constructor() {
        this.modal = document.getElementById("minigame-modal");
        this.title = document.getElementById("mg-title");
        this.desc = document.getElementById("mg-desc");
        this.area = document.getElementById("mg-area");
        this.actionBtn = document.getElementById("mg-action-btn");
        
        this.onComplete = null;
        this.animationFrameId = null;
        
        // Estados do Minijogo
        this.isCompleted = false;
        this.lastSuccess = false;
        this.isCanceled = false; 
    }

    resetModalState() {
        this.isCompleted = false;
        this.lastSuccess = false;
        this.isCanceled = false; // Reseta o cancelamento ao abrir
        this.actionBtn.innerText = "Desistir da Ação";
        this.actionBtn.style.background = "#dc3545"; // Vermelho
    }

    openWorkGame(onCompleteCallback) {
        this.resetModalState();
        this.onComplete = onCompleteCallback;
        this.modal.style.display = "flex";

        if (Math.random() > 0.5) {
            this.startEmailMinigame();
        } else {
            this.startReportMinigame();
        }
    }

    openSlackerGame(onCompleteCallback) {
        this.resetModalState();
        this.onComplete = onCompleteCallback;
        this.modal.style.display = "flex";
        this.startShooterMinigame();
    }

    openGymGame(intensity, onCompleteCallback) {
        this.resetModalState();
        this.onComplete = onCompleteCallback;
        this.modal.style.display = "flex";
        this.startGymMinigame(intensity);
    }

    handleModalButtonClick() {
        if (this.isCompleted) {
            // O jogo já foi finalizado (seja com sucesso ou falha)
            // Logo, NÃO foi cancelado.
            this.close();
            if (this.onComplete) {
                // Callback: (success = lastSuccess, canceled = false)
                this.onComplete(this.lastSuccess, false);
            }
        } else {
            // O jogo AINDA NÃO foi finalizado e o jogador clicou em "Desistir"
            this.isCanceled = true; 
            this.close();
            if (this.onComplete) {
                // Callback: (success = false, canceled = true)
                this.onComplete(false, true);
            }
        }
    }

    close() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.modal.style.display = "none";
        this.area.innerHTML = "";
    }

    // O parâmetro 'success' define se foi vitória (true) ou derrota (false)
    finishTask(success, message) {
        // Para a animação caso haja (Shooter ou Academia)
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.isCompleted = true;
        this.lastSuccess = success;
        this.isCanceled = false; // Se chegou ao fim natural, não foi cancelado

        this.desc.innerText = "Atividade Encerrada!";
        
        // Aplica uma cor diferente dependendo do sucesso ou falha
        const boxColor = success ? "#2ecc71" : "#e74c3c";
        this.area.innerHTML = `<div style="font-size: 16px; font-weight: bold; padding: 10px; color: ${boxColor};">${message}</div>`;
        
        // Altera o botão do modal para indicar que pode prosseguir
        this.actionBtn.innerText = "Fechar / Continuar";
        this.actionBtn.style.background = "#28a745"; // Verde para prosseguir
    }

    // ==========================================
    // MINIJOGOS DE TRABALHO (Com chance de FALHA)
    // ==========================================
    startEmailMinigame() {
        this.title.innerText = "📧 Enviar E-mail de Trabalho";
        this.desc.innerText = "Escolha o e-mail corporativo adequado para enviar ao seu chefe:";

        const emailPool = [
            { text: "Prezado gestor, segue em anexo o relatório trimestral para avaliação.", correct: true },
            { text: "Mano, que empresa chata do c&#%! Não agumento mais vocês! Vão se lascar!", correct: false },
            { text: "Mãe, você pode comprar pão quando voltar do mercado? Quentinho por favor.", correct: false },
            { text: "Se você não me der um aumento hoje, eu vou me demitir agora! Me paga!", correct: false },
            { text: "Estou enviando este e-mail só para fingir que estou trabalhando. Tédio!", correct: false }
        ];

        const shuffled = [...emailPool].sort(() => Math.random() - 0.5);

        let optionsHTML = '<div class="email-options">';
        shuffled.forEach((item) => {
            optionsHTML += `<button class="email-btn" onclick="minigame.handleEmailChoice(${item.correct})">${item.text}</button>`;
        });
        optionsHTML += '</div>';

        this.area.innerHTML = optionsHTML;
    }

    handleEmailChoice(isCorrect) {
        const msg = isCorrect 
            ? "🎯 **SUCESSO!** Você enviou o e-mail correto e fez um excelente trabalho!"
            : "⚠️ **FALHA!** Você enviou uma opção inadequada. A tarefa foi entregue com erros.";
        
        this.finishTask(isCorrect, msg);
    }

    startReportMinigame() {
        this.title.innerText = "📊 Montar Relatório com Gráficos";
        this.desc.innerText = "Clique no ÍCONE DE GRÁFICO (📊) correto para anexar ao relatório:";

        const items = [
            { icon: "📄", correct: false },
            { icon: "📊", correct: true },
            { icon: "🍕", correct: false },
            { icon: "✏️", correct: false },
            { icon: "💩", correct: false }
        ];

        const shuffled = [...items].sort(() => Math.random() - 0.5);

        let gridHTML = '<div class="chart-grid">';
        shuffled.forEach(item => {
            gridHTML += `<div class="chart-item" onclick="minigame.handleReportChoice(${item.correct})">${item.icon}</div>`;
        });
        gridHTML += '</div>';

        this.area.innerHTML = gridHTML;
    }

    handleReportChoice(isCorrect) {
        const msg = isCorrect 
            ? "🎯 **SUCESSO!** Você anexou o gráfico certo e o relatório ficou perfeito!"
            : "⚠️ **FALHA!** Você anexou o ícone errado ao relatório.";
        
        this.finishTask(isCorrect, msg);
    }

    // ==========================================
    // JOGO DE TIRO (Apenas Sucesso ou Desistência)
    // ==========================================
    startShooterMinigame() {
        this.title.innerText = "👾 Joguinho de Vadiar: Destrua os Monstros!";
        this.desc.innerText = "Mova o mouse para posicionar a nave e CLIQUE para atirar. Destrua TODOS os monstros!";

        this.area.innerHTML = '<canvas id="shooter-canvas" width="400" height="250"></canvas>';
        const canvas = document.getElementById("shooter-canvas");
        const ctx = canvas.getContext("2d");

        const numMonsters = Math.floor(Math.random() * 3) + 1;
        let monsters = [];

        for (let i = 0; i < numMonsters; i++) {
            const spawnFromLeft = Math.random() > 0.5;
            const speed = Math.random() * 2.5 + 1.5;
            const width = 40;
            const height = 30;
            const x = spawnFromLeft ? 0 : (canvas.width - width);
            const dx = spawnFromLeft ? speed : -speed;
            const y = 20 + i * 35;

            monsters.push({ x, y, width, height, speed, dx });
        }

        let ship = { x: 180, y: 210, width: 30, height: 25 };
        let bullets = [];

        const handleMouseMove = (e) => {
            if (this.isCompleted) return;
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            ship.x = Math.max(0, Math.min(canvas.width - ship.width, mouseX - ship.width / 2));
        };

        const handleClick = () => {
            if (this.isCompleted) return;
            bullets.push({
                x: ship.x + ship.width / 2 - 3,
                y: ship.y,
                width: 6,
                height: 12,
                speed: 7
            });
        };

        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("click", handleClick);

        const update = () => {
            if (this.isCompleted) return;

            monsters.forEach(m => {
                m.x += m.dx;
                if (m.x <= 0 || m.x + m.width >= canvas.width) {
                    m.dx *= -1;
                }
            });

            for (let i = bullets.length - 1; i >= 0; i--) {
                bullets[i].y -= bullets[i].speed;
                if (bullets[i].y < -20) {
                    bullets.splice(i, 1);
                    continue;
                }

                const b = bullets[i];
                let bulletHit = false;

                for (let j = monsters.length - 1; j >= 0; j--) {
                    const m = monsters[j];
                    if (
                        b.x < m.x + m.width &&
                        b.x + b.width > m.x &&
                        b.y < m.y + m.height &&
                        b.y + b.height > m.y
                    ) {
                        monsters.splice(j, 1);
                        bulletHit = true;
                        break;
                    }
                }

                if (bulletHit) {
                    bullets.splice(i, 1);
                }
            }

            // Apenas condição de sucesso
            if (monsters.length === 0) {
                canvas.removeEventListener("mousemove", handleMouseMove);
                canvas.removeEventListener("click", handleClick);
                this.finishTask(true, "🕹️ **VADIANDO COM SUCESSO!** Você destruiu todos os monstros!");
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            monsters.forEach(m => {
                ctx.fillStyle = "#fff";
                ctx.font = "20px Arial";
                ctx.fillText("👾", m.x + 8, m.y + 22);
            });

            ctx.fillStyle = "#fff";
            ctx.font = "18px Arial";
            ctx.fillText("🚀", ship.x + 4, ship.y + 20);

            ctx.fillStyle = "#f1c40f";
            bullets.forEach(b => {
                ctx.fillRect(b.x, b.y, b.width, b.height);
            });

            this.animationFrameId = requestAnimationFrame(update);
        };

        this.animationFrameId = requestAnimationFrame(update);
    }

    // ==========================================
    // MINIJOGO DA ACADEMIA (Apenas Sucesso ou Desistência)
    // ==========================================
    startGymMinigame(intensity) {
        let decayRate = 0.10;
        let gainPerClick = 5.0;
        let titleText = "🚶 Caminhada / Esteira (Treino Leve)";
        let successMsg = "🏋️ **TREINO CONCLUÍDO!** Você fez um ótimo treino na esteira!";

        if (intensity === "moderado") {
            decayRate = 0.20;
            gainPerClick = 5.5;
            titleText = "🏋️ Musculação (Treino Moderado)";
            successMsg = "🏋️ **TREINO CONCLUÍDO!** Você completou um bom treino de musculação!";
        } else if (intensity === "intenso") {
            decayRate = 0.30;
            gainPerClick = 6.0;
            titleText = "🔥 Crossfit / Funcional (Treino Intenso)";
            successMsg = "🔥 **TREINO CONCLUÍDO!** Você deu o seu máximo no Crossfit!";
        }

        this.title.innerText = titleText;
        this.desc.innerText = "Clique RÁPIDO para encher a barra até 100%!";

        let progress = 10;

        this.area.innerHTML = `
            <div class="gym-bar-container">
                <div id="gym-bar-fill" class="gym-bar-fill" style="width: 10%;"></div>
                <div id="gym-bar-text" class="gym-bar-text">10%</div>
            </div>
            <button id="gym-push-btn" class="gym-click-btn">💪 EMPURRAR / EXERCITAR!</button>
        `;

        const fillEl = document.getElementById("gym-bar-fill");
        const textEl = document.getElementById("gym-bar-text");
        const pushBtn = document.getElementById("gym-push-btn");

        pushBtn.addEventListener("click", () => {
            if (this.isCompleted) return;
            progress = Math.min(100, progress + gainPerClick);
        });

        const loop = () => {
            if (this.isCompleted) return;

            progress = Math.max(0, progress - decayRate);

            if (fillEl && textEl) {
                fillEl.style.width = `${progress}%`;
                textEl.innerText = `${Math.floor(progress)}%`;
            }

            // Apenas condição de sucesso
            if (progress >= 99) {
                this.finishTask(true, successMsg);
                return;
            }

            this.animationFrameId = requestAnimationFrame(loop);
        };

        this.animationFrameId = requestAnimationFrame(loop);
    }

     // ==========================================
    // MINIJOGO DA BANHEIRO (Apenas Sucesso ou Desistência)
    // ==========================================
    openBathGame(onCompleteCallback) {
        this.resetModalState();
        this.onComplete = onCompleteCallback;
        this.modal.style.display = "flex";
        this.startBathMinigame();
    }

    startBathMinigame() {
        this.title.innerText = "🚿 Hora do Banho: Esfregue-se!";
        this.desc.innerText = "Passe o mouse ou o dedo por toda a área do box para tirar o sabão (Meta: 90%)!";

        this.area.innerHTML = `
            <div style="position: relative; width: 300px; height: 200px; margin: 0 auto; background: #2c3e50; border-radius: 8px; overflow: hidden; cursor: crosshair;">
                <canvas id="bath-canvas" width="300" height="200" style="display: block;"></canvas>
                <div id="bath-progress-text" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 14px; pointer-events: none;">0%</div>
            </div>
        `;

        const canvas = document.getElementById("bath-canvas");
        const ctx = canvas.getContext("2d");
        const progressText = document.getElementById("bath-progress-text");

        // Desenha a camada de sabão na cor branca cobrindo a tela
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Configuração do pincel (tamanho aumentado para 50 para limpar mais rápido)
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = 50; 
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        let isDrawing = false;

        const getPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
            const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        const startDraw = (e) => {
            if (this.isCompleted) return;
            isDrawing = true;
            const pos = getPos(e);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
        };

        const draw = (e) => {
            if (!isDrawing || this.isCompleted) return;
            e.preventDefault();
            const pos = getPos(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();

            calculateCoverPercentage();
        };

        const stopDraw = () => {
            isDrawing = false;
        };

        canvas.addEventListener("mousedown", startDraw);
        canvas.addEventListener("mousemove", draw);
        canvas.addEventListener("mouseup", stopDraw);
        canvas.addEventListener("mouseleave", stopDraw);

        canvas.addEventListener("touchstart", startDraw);
        canvas.addEventListener("touchmove", draw);
        canvas.addEventListener("touchend", stopDraw);

        const calculateCoverPercentage = () => {
            if (this.isCompleted) return;

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;
            let transparentPixels = 0;
            const totalPixels = pixels.length / 4;

            for (let i = 3; i < pixels.length; i += 4) {
                if (pixels[i] === 0) {
                    transparentPixels++;
                }
            }

            const percentage = (transparentPixels / totalPixels) * 100;
            progressText.innerText = `${Math.floor(percentage)}%`;

            if (percentage >= 90) {
                canvas.removeEventListener("mousedown", startDraw);
                canvas.removeEventListener("mousemove", draw);
                canvas.removeEventListener("mouseup", stopDraw);
                
                this.finishTask(true, "🚿 **BANHO CONCLUÍDO!** Você está limpo, revigorado e cheiroso!");
            }
        };
    }

    openHaircutGame(targetStyle, hairColor, onCompleteCallback) {
        this.resetModalState();
        this.onComplete = onCompleteCallback;
        this.modal.style.display = "flex";
        this.startHaircutMinigame(targetStyle, hairColor);
    }

    startHaircutMinigame(targetStyle, hairColor) {
        this.title.innerText = "✂️ Corte de Cabelo";
        this.desc.innerText = "Passe o mouse ou o dedo sobre a linha tracejada horizontal para cortar os fios (Meta: 85%)!";

        this.area.innerHTML = `
            <div style="position: relative; width: 300px; height: 220px; margin: 0 auto; background: #4a5568; border-radius: 8px; overflow: hidden; cursor: crosshair;">
                <canvas id="haircut-canvas" width="300" height="220" style="display: block;"></canvas>
                <div id="haircut-progress-text" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 14px; pointer-events: none;">0%</div>
            </div>
        `;

        const canvas = document.getElementById("haircut-canvas");
        const ctx = canvas.getContext("2d");
        const progressText = document.getElementById("haircut-progress-text");

        const strokeColor = HAIR_COLOR_HEX[hairColor] || "#6b4226";
        const cutY = HAIRCUT_CUT_Y[targetStyle] ?? 115;
        const isWavy = targetStyle === "cacheado" || targetStyle === "crespo";
        const waveFreq = targetStyle === "crespo" ? 0.28 : 0.14;
        const waveAmp = targetStyle === "crespo" ? 4.5 : 6;

        const segmentsCount = 20;
        const cutSegments = new Array(segmentsCount).fill(false);
        const segWidth = canvas.width / segmentsCount;

        const drawHairStrand = (x, endY) => {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            if (isWavy) {
                for (let y = 2; y <= endY; y += 3) {
                    ctx.lineTo(x + Math.sin(y * waveFreq) * waveAmp, y);
                }
            } else {
                ctx.lineTo(x, endY);
            }
            ctx.stroke();
        };

        const drawScene = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 3;
            ctx.lineCap = "round";

            for (let i = 0; i < segmentsCount; i++) {
                const endY = cutSegments[i] ? cutY : canvas.height;
                const baseX = i * segWidth;
                drawHairStrand(baseX + segWidth * 0.28, endY);
                drawHairStrand(baseX + segWidth * 0.72, endY);
            }

            ctx.save();
            ctx.strokeStyle = "#f1c40f";
            ctx.lineWidth = 2.5;
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.moveTo(0, cutY);
            ctx.lineTo(canvas.width, cutY);
            ctx.stroke();
            ctx.restore();
        };

        drawScene();

        let isCutting = false;

        const getPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            const point = e.touches && e.touches.length > 0 ? e.touches[0] : e;
            return {
                x: (point.clientX || 0) - rect.left,
                y: (point.clientY || 0) - rect.top
            };
        };

        const cutAt = (pos) => {
            if (this.isCompleted) return;
            if (Math.abs(pos.y - cutY) > 22) return;

            const idx = Math.floor(pos.x / segWidth);
            if (idx < 0 || idx >= segmentsCount || cutSegments[idx]) return;

            cutSegments[idx] = true;
            drawScene();

            const cutCount = cutSegments.filter(Boolean).length;
            const percentage = Math.round((cutCount / segmentsCount) * 100);
            progressText.innerText = `${percentage}%`;

            if (percentage >= 85) {
                cleanup();
                this.finishTask(true, "✂️ **CORTE CONCLUÍDO!** Novo visual finalizado com precisão!");
            }
        };

        const startCut = (e) => {
            if (this.isCompleted) return;
            isCutting = true;
            if (e.touches) e.preventDefault();
            cutAt(getPos(e));
        };

        const moveCut = (e) => {
            if (!isCutting || this.isCompleted) return;
            e.preventDefault();
            cutAt(getPos(e));
        };

        const stopCut = () => {
            isCutting = false;
        };

        const cleanup = () => {
            canvas.removeEventListener("mousedown", startCut);
            canvas.removeEventListener("mousemove", moveCut);
            canvas.removeEventListener("mouseup", stopCut);
            canvas.removeEventListener("mouseleave", stopCut);
            canvas.removeEventListener("touchstart", startCut);
            canvas.removeEventListener("touchmove", moveCut);
            canvas.removeEventListener("touchend", stopCut);
        };

        canvas.addEventListener("mousedown", startCut);
        canvas.addEventListener("mousemove", moveCut);
        canvas.addEventListener("mouseup", stopCut);
        canvas.addEventListener("mouseleave", stopCut);
        canvas.addEventListener("touchstart", startCut);
        canvas.addEventListener("touchmove", moveCut);
        canvas.addEventListener("touchend", stopCut);
    }
}

const minigame = new MinigameManager();