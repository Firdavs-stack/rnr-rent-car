import { Link } from "react-router-dom";
import { formatUSD, formatUZS, toUZS } from "../../utils/currency";
const labels = {
  AVAILABLE: "Доступен",
  RESERVED: "Забронирован",
  RENTED: "В аренде",
  MAINTENANCE: "Обслуживание",
  PREPARATION: "Подготовка",
  WASHING: "Мойка",
  DAMAGED: "Повреждён",
  UNAVAILABLE: "Недоступен",
};
export default function CarCard({ car }) {
  const image = car.images?.[0];
  return (
    <Link
      to={`/cars/${car.slug}${window.location.search}`}
      className="car-card"
    >
      <div className="car-card-media">
        {image ? (
          <img
            src={image.url}
            alt={image.alt || `${car.brand} ${car.model}`}
            loading="lazy"
          />
        ) : (
          <div className="media-missing">
            <span>{car.brand}</span>
            <small>Фотография пока недоступна</small>
          </div>
        )}
        <span className={`badge badge-${car.status.toLowerCase()}`}>
          {labels[car.status]}
        </span>
      </div>
      <div className="car-card-body">
        <div className="eyebrow">
          {car.category || car.brand} {car.year ? ` / ${car.year}` : ""}
        </div>
        <h3>
          {car.brand} {car.model}
        </h3>
        <p>{car.shortDesc}</p>
        <div className="car-card-specs">
          {[
            car.bodyType,
            car.fuelType,
            car.transmission,
            car.seats && `${car.seats} мест`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </div>
        <div className="car-card-price">
          <div>
            <strong>{formatUSD(car.pricePerDay)}</strong>
            <span> / сутки</span>
            <small>{formatUZS(toUZS(car.pricePerDay))}</small>
          </div>
          <span className="card-arrow" aria-label="Подробнее">
            ↗
          </span>
        </div>
      </div>
    </Link>
  );
}
