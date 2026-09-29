export type ProviderOrder={orderId:string};
export interface SmmProvider{createOrder(input:{serviceId:string;link:string;quantity:number}):Promise<ProviderOrder>;getOrderStatus(id:string):Promise<string>;getBalance():Promise<number>;getServices():Promise<unknown[]>}
export class MockSmmProvider implements SmmProvider{async createOrder(){if(process.env.SMM_MOCK_FORCE_FAILURE==='true')throw new Error('Mock provider failure');return {orderId:`MOCK-${Date.now()}`}}async getOrderStatus(){return 'PROCESSING'}async getBalance(){return 0}async getServices(){return []}}
export class ApiSmmProvider implements SmmProvider{
 private url=process.env.SMM_API_URL!;private key=process.env.SMM_API_KEY!;
 private async call(body:Record<string,unknown>){
  if(!this.url||!this.key)throw new Error('SMM chưa cấu hình');
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
  try{const r=await fetch(this.url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...body,key:this.key}),signal:controller.signal});if(!r.ok)throw new Error('SMM provider lỗi');return r.json()}finally{clearTimeout(timeout)}
 }
 async createOrder(i:{serviceId:string;link:string;quantity:number}){const x=await this.call({action:'add',...i});const id=x?.order??x?.orderId;if(!id)throw new Error('SMM provider không trả mã đơn');return {orderId:String(id)}}
 async getOrderStatus(id:string){const x=await this.call({action:'status',order:id});return String(x.status)}
 async getBalance(){const x=await this.call({action:'balance'});return Number(x.balance)}
 async getServices(){return this.call({action:'services'})}
}
export const getSmmProvider=()=>{
 if(process.env.SMM_PROVIDER==='api'){if(!process.env.SMM_API_URL||!process.env.SMM_API_KEY)throw new Error('SMM production chưa được cấu hình');return new ApiSmmProvider()}
 if(process.env.NODE_ENV!=='production')return new MockSmmProvider();
 throw new Error('SMM_PROVIDER phải là api trong production');
};
