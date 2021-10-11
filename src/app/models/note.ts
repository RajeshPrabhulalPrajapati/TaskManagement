export interface Note{
    noteId:string;
    priority:number;
    title:string;
    content:string;
    todo:string;
    notificationDateTime:Date;
    notification:boolean;
    userId:string;
    assignTo:string;
    assignBy:string;
    isTaskCompleted:boolean;
}