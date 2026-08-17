(function(){
  function root(){
    return (window.Shopify && Shopify.routes && Shopify.routes.root) || '/';
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

    window.buyNow=function(id,qty){
      qty=Math.max(1,Number(qty)||1);
      var p=(typeof window.byId==='function')?window.byId(id):null;
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
