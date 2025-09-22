# Usando Node 24.6.0
FROM node:24.6.0

# Diretório de trabalho
WORKDIR /usr/src/app

# Copiar dependências
COPY package*.json ./
RUN npm install --production

# Copiar código
COPY . .

# Expor porta do backend
EXPOSE 3000

# Comando para rodar
CMD ["node", "app.js"]
