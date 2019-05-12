class RepeatList {

    constructor(){
        this.size = 0;
        this.storage = null;        
        this.items = [];
        this.postIds = [];
        this.postIdsTemp = []
    }

    isEmpty(){
        try{
            return this.items.length === 0;
        }catch(err){
            console.error(err);
        }           
    }

    push(item){
        try{
            if(this.postIds.indexOf(item.originalId) == -1){
                this.postIds.push(item.originalId);
                item.runningCount = 0;
                item.show = 0;
                this.items.push(item);
                this.size++;
            }
        }catch(err){
            console.error(err);
        }
    }

    updatePostRunningCount(){
        try{
            if(this.items.length > 0){ 
                this.items.forEach((item) => {
                    if(this.postIdsTemp.indexOf(item.originalId) > -1){ //check post id in temp (anyway) if exist start increment
                        console.log(item.runningCount++);
                        if(item.runningCount == item.repeat_count){
                            item.runningCount = 0;
                            item.show = 0; 
                        }                        
                    }
                });
            } 


        }catch(err){
            console.error(err);
        }
    }


    update(postId){
        try{
            this.items.forEach((item) => {
                if(item.originalId == postId){
                    item.show = 1;
                    this.postIdsTemp.push(postId);
                }

            })
        }catch(err){
            console.error(err);
        }
    }

    remove(postId){
        try{
            if(this.items.length > 0){
                this.items.forEach((item, i) => {
                    if(item.originalId == postId){
                        this.items.splice(i, 1);  
                    }
                })
            }
        }catch(err){
            console.error(err);
        }        
    }

    isExist(post){
        try{
            if(this.items.length > 0){
                this.items.forEach((item) => {
                    if(item.originalId == post.originalId){
                        return true;
                    } 
                    return false;
                });
            }
        }catch(err){
            console.error(err);
        }
    }

    get(){
        try{
            let length = this.items.length;
            if(length > 0){
                for(let i = 0; i < length; i++){
                     if(this.items[i].show == 0){
                         return this.items[i];
                     }                   
                }
                return null;
            }            
        }catch(err){

        }
    }

    showItems(){
        console.log(this.items);
    }


}