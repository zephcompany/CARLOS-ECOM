(function(){
  function root(){
    return (window.Shopify && Shopify.routes && Shopify.routes.root) || '/';
  }

  function findProduct(id){
    var list=window.NH_SHOPIFY_PRODUCTS||[];
    for(var i=0;i<list.length;i++){
      if(String(list[i].id)===String(id))return list[i];
    }
    return null;
  }

  function refreshCartBadge(){
    var badge=document.getElementById('cart-count');
    if(!badge)return;
    badge.style.display='none';
    fetch(root()+'cart.js',{credentials:'same-origin'})
      .then(function(r){return r.json();})
      .then(function(cart){
        var count=Number(cart.item_count||0);
        badge.textContent=count;
        badge.style.display=count>0?'flex':'none';
      })
      .catch(function(){});
  }

  function ensureQtyStyles(){
    if(document.getElementById('nh-cart-qty-hotfix'))return;
    var style=document.createElement('style');
    style.id='nh-cart-qty-hotfix';
    style.textContent='\
      .cqty{display:inline-flex!important;align-items:center!important;gap:0!important;border:1px solid var(--line)!important;border-radius:var(--r)!important;margin-top:8px!important;overflow:hidden!important;background:#fff!important;width:auto!important;}\
      .cqty button{width:32px!important;height:30px!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:0!important;margin:0!important;line-height:1!important;font-size:17px!important;color:var(--ink)!important;background:#fff!important;border:0!important;}\
      .cqty button:hover{background:var(--fill)!important;}\
      .cqty span{width:34px!important;height:30px!important;display:flex!important;align-items:center!important;justify-content:center!important;border-left:1px solid var(--line)!important;border-right:1px solid var(--line)!important;font-size:13px!important;font-weight:700!important;line-height:1!important;}';
    document.head.appendChild(style);
  }

  function directCheckout(id,qty){
    qty=Math.max(1,Number(qty)||1);
    var p=findProduct(id);
    if(!p || !p.variantId)return;
    window.location.href=root()+'cart/'+encodeURIComponent(p.variantId)+':'+qty+'?checkout';
  }

  function applyOverrides(){
    ensureQtyStyles();
    refreshCartBadge();

    /* Botões/card que já chamam buyNow. */
    window.buyNow=function(id,qty){
      directCheckout(id,qty);
    };

    /* PDP: o HTML original chama addPdp(true) no botão Comprar agora.
       Quando true, não adiciona no drawer: vai direto ao checkout do item atual. */
    window.addPdp=function(buy){
      if(typeof pdpId==='undefined' || !pdpId)return;
      var qty=(typeof pdpQty==='undefined')?1:pdpQty;
      if(buy){
        directCheckout(pdpId,qty);
        return;
      }
      if(typeof addToCart==='function')addToCart(pdpId,qty);
    };
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',applyOverrides);
  }else{
    applyOverrides();
  }
})();
