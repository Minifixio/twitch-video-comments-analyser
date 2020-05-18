"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const CommentsAnalyser_1 = require("./CommentsAnalyser");
console.log('fa');
const anaylser = new CommentsAnalyser_1.CommentAnalyser('u6xyqmq1ctnewqvsce30egzkb9ajum', true);
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('run');
    const comments = yield anaylser.getComments(619607685, 500, 600);
    console.log(comments);
    const emoticonsDatas = anaylser.emoticonStats(comments);
    const sortByUsers = anaylser.sortByUsers(comments);
    const highlights = anaylser.sortByTimeRange(comments, 20);
});
run().catch(error => console.log(error));
setTimeout(function () { alert("Hello"); }, 500000);
//# sourceMappingURL=index.js.map