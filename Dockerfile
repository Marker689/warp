# Используем легковесный nginx для обслуживания статики
FROM nginx:alpine

# Копируем статические файлы в папку nginx
COPY src /usr/share/nginx/html

# Копируем конфигурацию nginx (опционально)
# COPY nginx.conf /etc/nginx/nginx.conf

# Открываем порт 80
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]