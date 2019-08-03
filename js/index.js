
var btns = document.querySelectorAll('.btns button');
var mine = null;
var gameDataList = [
    {
        tr: 9,
        td: 12, 
        level: 1,
    },{
        tr: 12,
        td: 16, 
        level: 2,
    },{
        tr: 16,
        td: 20, 
        level: 3,
    }
];

for(let i = 0; i < btns.length -1; i++) {
    // 形成链表
    i < btns.length - 2 && (btns[i].next = btns[i+1]);
    btns[i].onclick = function() {
        document.getElementsByClassName('active')[0].className = '';
        btns[i].className = 'active';
        var obj = {
            ...gameDataList[i],
            dom: this
        }
        mine = new Mine(obj);
    }
}

btns[0].onclick();
btns[btns.length -1].onclick = function () {
    mine.init();
}