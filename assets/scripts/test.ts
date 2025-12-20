// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {


    protected bgSpeed: number = 400;
    sp1: sp.Skeleton;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        this.sp1 = this.node.getComponent(sp.Skeleton);
        cc.log("正常的sKeletonData",this.sp1.skeletonData,"------------------")
        this.scheduleOnce(() => {
            this.changeSkin(this.sp1);
        }, 1);
    }

    changeSkin(sp1: sp.Skeleton) {
        // sp1.findSlot("2帽子互换初始").color.a = 0;
        // sp1.setAttachment("2帽子互换成功", "2帽子互换成功");
        // sp1.setAttachment("1女3抬手手包", "1女3抬手手包");
        // sp1.setAttachment("7牵手成功", "7牵手成功");
        if (sp1.node.name == "1") {
            this.sp1.setAttachment("1檀力球", "1檀力球");
            this.sp1.setAttachment("1檀小呆", "1檀小呆");
        }
        else if (sp1.node.name == "3") {
            sp1.setAttachment("3黏黏", "3黏黏");

        }

        // update(dt) {
        //     this.sp1.setAttachment("1檀小呆", "1檀小呆");
        // }
    }
}
