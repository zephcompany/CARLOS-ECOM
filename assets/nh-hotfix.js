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

  function applyOverrides(){
    refreshCartBadge();

    /* Comprar Agora: vai direto ao checkout somente com o produto/quantidade escolhidos,
       sem abrir nem depender do drawer do carrinho. */
    window.buyNow=function(id,qty){
      qty=Math.max(1,Number(qty)||1);
      var p=findProduct(id);
      if(!p || !p.variantId)return;
      window.location.href=root()+'cart/'+encodeURIComponent(p.variantId)+':'+qty+'?checkout';
    };
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',applyOverrides);
  }else{
    applyOverrides();
  }
})();
