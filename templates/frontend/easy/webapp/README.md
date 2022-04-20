# userm-easy

Dashboard experimental para testar formas simplificadas de configurar perms e roles no UserM.

## Instalar numa nova máquina

1. upgrade UserM

   Acrescenta a permissão que permite consultar dashboards.

   Tem que ser uma versão depois do `007966a3bae` (2019-10-23)


2. upgrade ui-userm

   Acrescenta arranque do módulo CustomResource.

   Tem que ser posterior ao `beddabc55` (2019-10-30)


3. configuração UserM

   O UserM, ao contrário do RecordM, não vem com as CustomUI ligadas por default.

   É necessário editar o `/etc/userm/services/com.cultofbits.web.integration.properties` e acrescentar:

	      custom-ui.base-path=/etc/userm/customUI


4. deploy dos ui-vue-componentes

   ver https://github.com/cob/ui-vue-components sem esquecer a parte de criar o `customizations2.js`

   Nota: como algumas das directorias de destino não devem existir no UserM, é normalmente necessário ir correndo e criando as directorias que faltam até que deixe de dar erro.


5. deploy do dashboard

   Neste momento é necessário alterar o `package.json` para colocar o servidor destino.

   Antes do deploy, será preciso:

   * instalar as dependências, caso ainda não o tenham feito, com o `npm install`
   * fazer build com `npm run build`

   Por fim:

   `npm run dist`


## Correr localmente

Nota: mesmo para correr localmente, os pontos 1 a 4 da instalação numa máquina nova têm que ser seguidos.

1. executar `npm run serve --remote-server=https://<um-servidos-qualquer>.cultofbits.com`

2. aceder a http://localhost:8080/userm/index.html#/cob.custom-resource/easy/easy



