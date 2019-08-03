(function (window) {
    var gameTimer = -1; // 定时器
    var gameTime = 0; //本次游戏时间
    var gameScore = 0; //本次游戏总分
    var gameRule = [{basePer: .08,steps:3, addPer:.03}, {basePer: .12,steps:5, addPer:.02}, {basePer: .16,steps:10, addPer:.02}];
    function Mine({ tr, td, level, dom}){
        this.tr = tr; //行数
        this.td = td; //列数
        this.squares = tr * td;//方格总数

        this.dom = dom;//本关卡对应的触发对象，可省略

        this.config = gameRule[level-1]; //当前级别的配置
        // level 为当前等级从1开始的数字
        this.mineNum = Math.round(this.squares * this.config.basePer); //本关卡基础雷数
        this.curStep = 1;//当前等级的阶段

        this.doms = []; //用于保存每个方格dom
        this.data = []; //用于保存方格数据

        this.init();
        !dom && (this.nextStepDom.innerHTML = '继续游戏');
    }
    // 只声明一次的属性，对象的共同属性
    // 注意：querySelector是有风险的(是不实时)，用querySelector出于方便且游戏目前没有修改dom结构
    Mine.prototype = {
        wrapper: document.getElementById('mine'),//主入口
        gameBox: document.querySelector('#mine .gameBox'),//游戏操作区
        mineNumDom:  document.querySelector('#mine .mineNum'),//显示雷数的dom
        scoreDom:  document.querySelector('#mine .score'),//显示分数的dom
        timeDom:  document.querySelector('#mine .time'),//显示本关时间的dom
        gameEndPage: document.querySelector('#mine .gameEnd'),//弹窗父级
        infoBox: document.querySelector('#mine .infoBox'),//弹窗
        gameStatusDom: document.querySelector('#mine .gameStatus'),//游戏输赢结果
        gameScoreDom: document.querySelector('#mine .gameScore'),//游戏得分
        gameTimeDom: document.querySelector('#mine .gameTime'),//游戏时间
        nextStepDom: document.querySelector('#mine .nextStep'),//继续游戏按钮
        newGameDom: document.querySelector('#mine .newGame'),//重新游戏按钮

        unClicked: 0, //未点击的方格数
        surplusMine: 0, //标记后剩余雷数
        score: 0, // 得分
        time: 0, // 本局所用时间
    }
    // 初始化
    Mine.prototype.init = function () {
        clearInterval(gameTimer);
        this.time = 0;
        this.timeDom.innerHTML = '00:00';

        this.surplusMine = this.mineNum;
        this.unClicked = this.tr * this.td;

        this.score = 0;
        this.scoreDom.innerHTML = this.score;
        
        this.createDom();
        this.initNumber();
        this.bindEvent();
    }

    // 创建dom元素
    Mine.prototype.createDom = function () {
        this.gameBox.innerHTML = '';
        var table = document.createElement('table');
        this.doms = [];
        this.data = [];
        var mines = this.getRadomMines();
        var n = 0; //一维索引
        for(var i = 0; i < this.tr; i++) {
            var tr = document.createElement('tr');
            this.doms[i] = [];
            this.data[i] = [];
            for(var j = 0; j < this.td; j++) {
                var td = document.createElement('td');
                td.isTd = true;
                if(mines.indexOf(n++) != -1) {
                    this.data[i][j] = {type: 'mine', x: i, y: j};
                }else {
                    this.data[i][j] = {type: 'number', x: i, y: j, value: 0};
                }
                td.data = this.data[i][j];
                this.doms[i][j] = td;
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
        this.gameBox.appendChild(table);
        this.mineNumDom.innerHTML = this.surplusMine;
    }

    // 获取随机雷
    Mine.prototype.getRadomMines = function () {
        var tempArr = new Array(this.tr * this.td);
        for(var i = 0; i < tempArr.length; i++) {
            tempArr[i] = i;
        }
        tempArr.sort(function(){return 0.5 - Math.random()});
        return tempArr.slice(0, this.mineNum);
    }

    // 根据雷初始化周边数字
    Mine.prototype.initNumber = function () {
        var _this = this;
        for(var i = 0; i < this.tr; i++) {
            for(var j = 0; j < this.td; j++) {
                if(this.data[i][j].type == 'number') continue;

                var arr = this.getAround(this.data[i][j]);
                arr.forEach(function (item) {
                    _this.data[item.x][item.y].value += 1;
                });
            }
        }
    }

    // 获取周围的非雷方格坐标
    Mine.prototype.getAround = function(data) {
        var x = data.x,
            y = data.y,
            res = [];
            for(var i=x-1;i<=x+1;i++){
                for(var j=y-1;j<=y+1;j++){
                    if(i<0 || j<0 || i>=this.tr || j>=this.td || (i==x && j==y) || this.data[i][j].type=='mine') {continue;}
                    res.push({x:i,y:j});
                }
            }
        return res;
    }

    //绑定事件
    Mine.prototype.bindEvent = function () {
        var _this = this;
        var table = this.gameBox.getElementsByTagName('table')[0];
        // 事件委托
        table.onmousedown = function (e) {
            clearInterval(gameTimer);//防止多个计时器重叠
            _this.time = 0;
            gameTimer = setInterval(function () {
                _this.time += 1;
                _this.timeDom.innerHTML = formatTime(_this.time);
            }, 1000);

            function formatTime(t) {
                var time = '';
                var h = Math.floor(t / 3600);
                var m = Math.floor(t % 3600 / 60);
                var s = t % 60;

                if(h) {
                h = h < 10 ? '0' + h : h;
                time += h + ':'; 
                }
                m = m < 10 ? '0' + m : m;
                s = s < 10 ? '0' + s : s;
                return time + m + ':' + s;
            }

            table.onmousedown = function (e) {
                if(e.target.isTd && !e.target.check) {
                    _this.play(e.which, e.target);
                }
                return false;
            }

            if(e.target.isTd && !e.target.check) {
                _this.play(e.which, e.target);
            }
        }
        // 取消右键菜单效果
        this.wrapper.oncontextmenu = function () {
            return false;
        }
        this.nextStepDom.onclick = function () {
            _this.gameEndPage.style.display = 'none';
            // 当没有传递dom对象时,默认普通模式
            if(!_this.dom) {
                _this.resetScoreAndTime();
                _this.init();
                return;
            }
            // 关卡模式
            // 当前级别的不同难度
            if(++_this.curStep <= _this.config.steps) {
                // 设置下一阶段的雷数
                var per = _this.config.basePer + _this.config.addPer * (_this.curStep - 1);
                _this.mineNum = Math.round(_this.squares * per);
                _this.init();
                return;
            }
            // 下一级别
            _this.dom.next && _this.dom.next.onclick();
        }
        this.newGameDom.onclick = function (e) {
            _this.gameEndPage.style.display = 'none';
            _this.mineNum = _this.mineNum;
            _this.mineNum = Math.round(_this.squares * _this.config.basePer);
            _this.resetScoreAndTime();
            _this.init();
        }

        // 阻止事件冒泡
        this.nextStepDom.onmousedown = this.newGameDom.onmousedown = function (e) {
            e.stopPropagation();
        }

        // 拖拽
        this.infoBox.onmousedown = function (e) {
            var event = e || window.event;
            var disX = event.clientX - this.offsetLeft;
                disY = event.clientY - this.offsetTop;
            document.onmousemove = function (e) {
                var event = e || window.event;
                _this.infoBox.style.left = event.clientX - disX + 'px';
                _this.infoBox.style.top = event.clientY - disY + 'px';
            }
            document.onmouseup = function () {
                document.onmousemove = null;
                this.onmouseup = null;
            }
        }
        
    }

    // playGame
    Mine.prototype.play = function (onMouseType, dom) {
        var _this = this,
        data = dom.data;
        if(onMouseType == 1 && dom.className != 'flag') {//左键并且没有标旗
            // 是雷时游戏结束,退出函数
            if(data.type == 'mine') {
                this.gameOver(dom); return;
            }
            var classList = ['zero','one','two','three','four','five','six','seven','eigth'];
            // 大于0的数字,渲染数字并退出函数
            if(data.value != 0) {
                render(dom); return;
            }
            // 渲染检测过的空格
            function render (dom) {
                var data = dom.data,
                    val = data.value;
                dom.className = classList[val];
                dom.innerHTML = val == 0 ? '' : val;

                if(val == 0 && !dom.check){
                    dom.check = true;
                    ClearNearZero(dom.data);
                }
                dom.check = true;
                _this.unClicked --;

                _this.scoreDom.innerHTML = ++_this.score;

                // 判断游戏是否结束
                _this.unClicked == _this.mineNum && _this.gameComplete();
            }
            // 为空白区时
            render(dom);
            // 递归函数,消除相邻空白区
            function ClearNearZero(data) {
                var arr = _this.getAround(data);
                arr.forEach(function (item) {
                    var oDom = _this.doms[item.x][item.y];
                    // 被标记旗子的方格不会自动消除
                    if(oDom.className == 'flag' || oDom.check) return;
                    render(oDom);
                })
            }
        }else if(onMouseType == 3) {//右键
            if(dom.className == 'flag') {
                dom.className  = '';
                this.mineNumDom.innerHTML = ++this.surplusMine;
            }else {
                dom.className  = 'flag';
                this.mineNumDom.innerHTML = --this.surplusMine;
            }
        }
    }

    // 完成游戏
    Mine.prototype.gameComplete = function () {
        if(this.dom && !this.dom.next && (this.curStep+1) > this.config.steps) {
            this.gameStatusDom.innerHTML = '恭喜你通过所有关卡！';
            this.nextStepDom.style.display = 'none';
        }else {
            this.gameStatusDom.innerHTML = '恭喜你，任务完成！';
            this.nextStepDom.style.display = 'inline-block';
        }
        this.gameEnd();
    }

    // 游戏失败
    Mine.prototype.gameOver = function (clickDom) {
        // 显示雷
        for(var i = 0; i < this.tr; i++) {
            for(var j = 0; j < this.td; j++) {
                this.data[i][j].type=='mine' && (this.doms[i][j].className='mine');
            }
        }
        // 标记点击的雷
        if(clickDom){
            clickDom.style.backgroundColor='orange';
        }
        this.gameStatusDom.innerHTML = '很遗憾，任务失败！';
        this.nextStepDom.style.display = 'none';
        this.gameEnd();
    }

    // 游戏结束
    Mine.prototype.gameEnd = function () {
        var table = this.gameBox.getElementsByTagName('table')[0];
        // 取消点击事件
        table.onmousedown = null;
        // 清除定时器
        clearInterval(gameTimer);
        
        gameScore += this.score;
        this.gameScoreDom.innerHTML = gameScore;

        gameTime += this.time;
        var m = Math.floor(gameTime / 60);
        var s = gameTime % 60;
        this.gameTimeDom.innerHTML = m + '分' + s + '秒';

        this.gameEndPage.style.display = 'block';
    }

    Mine.prototype.resetScoreAndTime = function () {
        gameTime = 0;
        gameScore = 0;
    }
    window.Mine = Mine;
}(window));


