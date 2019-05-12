"use strict"
class Nodes {
    constructor(data){
        this.data = data;
        this.next = null;
    }
}


class CircularList {
    constructor(){
        this.head = null;
        this.size = 0;
        this.currentRenderedNode = null; 
        this.isLastNode = false;       
    }

    isEmpty(){
        return this.head === null;                
    }    

    listFirstNode(){
        try{
            return this.currentRenderedNode = this.head.data;
        }catch(err){
            console.error(err);
        }        
    }
    
    listSize(){
        try{
            let current = this.head;
            let count = 0;
            while(current !== null ){
                count++;
                current = current.next
            }
            return count;
        }catch(err){
            console.error(err);
        }
    }    
    
    add(post){
        try{
            let  nodes = new Nodes(post);
            if(this.isEmpty()){
                this.head = nodes;
                this.size++;
                if(!this.isLastNode){
                    this.riseEvent();
                }    
                return
            }  
            let current = this.head;
            while(current.next !== null ){
                current = current.next;
            }
            current.next = nodes;
            this.size++; 
        }catch(err){
            console.error(err);
        }
    }

    removeNode(postid){
        try{
            let current = this.head; 
            let prev;

            if(current.data.originalId === postid){ 
                this.head = current.next;
                this.size--;
                return
            }
            while(current.next != null ){            
      //      while(current.next.data.originalId != postid){
                if(current.data.originalId === postid){
                    prev.next = current.next;
                    this.size--;
                    return
                } else {
                    prev = current;
                    current = current.next;                    
                }
            }

            // console.log(this.size);
            
        }catch(err){
            console.error(err);
        }         
    }

	getcurrent(){
		return this.currentRenderedNode;
    }

	getNext(){
        return new Promise((resolve, reject) => {
            try{
                let current = this.head;
                // console.log(current);
                // console.log(this.size);
                if(this.size === 1){
                    this.isLastNode = true;
                    return resolve(this.listFirstNode());
                }                
                if(this.isLastNode){
                    this.isLastNode = false;
                    return resolve(this.listFirstNode());
                }
                this.isLastNode = false;
                while(current.next != null){
                    if(current.data.originalId == this.currentRenderedNode.originalId){
                        if(current.next.next === null){
                            this.isLastNode = true;
                        }                    
                        this.currentRenderedNode = current.next.data;
                        return resolve(this.currentRenderedNode);
                        
                    } else {
                        current = current.next;
                    }	
                }
            }catch(err){
                reject(err)
            }
        });
    }
    
    getAllPost(){
        return new Promise((resolve, reject) => {
            try{
                let current = this.head;
                let list = [];
                
                while(current.next != null){
                    list.push(current.data)
                    current = current.next;
                }

                if(current.next == null){
                    list.push(current.data);
                }
                resolve(list);
            }catch(err){
                reject(err);
            }
        });
    }    

    insertAfter(currentRenderedNode, post){
        try{
            let nodes = new Nodes(post);

            let current = this.head;

            while(current.next != null){
                if(current.data.originalId === currentRenderedNode.originalId){
                    nodes.next = current.next;
                    current.next = nodes;
                    this.size++;
                    return
                } else {
                    current = current.next;
                }
            }

			if(current.next === null){
                current.next = nodes;
                this.size++;
            }	
           
        }catch(err){
            console.error(err);
        }        
    }

    lastNode(){
        return new Promise((resolve, reject) => {
            try{    
                if(this.chkSize() > 1){
                    let current = this.head;
                    let node;
                    while(current.next != null ){
                        current = current.next;
                        if(current.next === null){
                            node = current.data;
                        }
                    }
                    resolve(node);
                }
            }catch(err){
                reject(err);
            } 
        });
    }     

    clearList(){
        this.head = null;
        this.size = 0;
    }
    
    showList(){
        return this.head;
    }
    
    riseEvent(){
        window.removeEventListener("contentready", function(event) {}, false); 
        window.dispatchEvent(new CustomEvent("contentready", {
            detail: { datastructure: "circularlist" }
        }));               
    }    

}   