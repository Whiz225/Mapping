'use strict';

const workouts = document.querySelector('.workouts');
const form = document.querySelector('.form');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputCadence = document.querySelector('.form__input--cadence');
const inputDuration = document.querySelector('.form__input--duration');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  Workouts = [];
  map;
  #mapZoomLevel = 13;
  #mapEvent;

  constructor() {
    this._getLocalStorage();
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    workouts.addEventListener('click', this._moveToPopup.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () =>
        alert(`Could not get your current position`)
      );
  }

  _loadMap(position) {
    const { latitude: lag, longitude: lng } = position.coords;
    const coords = [lag, lng];
    this.map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);
    this.Workouts.map(el => {
      this._renderWorkoutMArker(el);
    });
    this.map.on('click', this._showForm.bind(this));
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.Workouts));
  }

  _getLocalStorage() {
    const workout = JSON.parse(localStorage.getItem('workouts'));
    workout.map(el => {
      this.Workouts.push(el);
      this._renderWorkout(el);
    });
  }

  _newWorkout(e) {
    e.preventDefault();

    const validInputs = (...input) => input.every(el => Number.isFinite(el));
    const allPositives = (...input) => input.every(el => el > 0);

    const { lat, lng } = this.#mapEvent.latlng;

    const coords = [lat, lng];
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    let workout;

    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositives(distance, duration, cadence)
      )
        return alert('Input have to be positive numbers!');
      workout = new Running(distance, duration, coords, type, cadence);
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositives(distance, duration)
      )
        return alert('Input have to be positive numbers!');
      workout = new Cycling(distance, duration, coords, type, elevation);
    }

    this.Workouts.push(workout);
    this._renderWorkout(workout);
    this._renderWorkoutMArker(workout);
    this._setLocalStorage();
    this._hideForm();
  }

  _renderWorkout(workout) {
    const html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
      <h2 class="workout__title">${workout.description} on April 14</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${
          workout.cadence || workout.elevation
        }</span>
        <span class="workout__unit">${
          workout.type === 'cycling' ? 'km/h' : 'min/km'
        }</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'cycling' ? '⛰' : '🦶🏼'
        }</span>
        <span class="workout__value">178</span>
        <span class="workout__unit">${
          workout.type === 'cycling' ? 'm' : 'spm'
        }</span>
      </div>
    </li>`;

    // workouts.insertAdjacentHTML('beforeend', html);
    form.insertAdjacentHTML('afterend', html);
  }

  _renderWorkoutMArker(workout) {
    L.marker(workout.coords)
      .addTo(this.map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? ' 🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
    form.classList.add('hidden');
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _moveToPopup(e) {
    const tar = e.target.closest('.workout');
    if (!tar) return;
    const cur = this.Workouts.find(
      el => el.id === +e.target.closest('.workout').dataset.id
    );

    this.map.setView(cur.coords, 14);
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();

class Workout {
  date = new Date();
  id = (Math.trunc(Math.random() * Date.now()) + '').slice(-10) + 1;
  constructor(distance, duration, coords, type) {
    this.type = type;
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
    this._setDescription();
  }

  _setDescription() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    this.description = `${
      this.type.slice(0, 1).toUpperCase() + this.type.slice(1)
    } on ${months[this.date.getMonth()]}`;
    return this.description;
  }
}

class Running extends Workout {
  constructor(distance, duration, coords, type, cadence) {
    super(distance, duration, coords, type);
    this.cadence = cadence;

    this.calPace();
  }

  calPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  constructor(distance, duration, coords, type, elevation) {
    super(distance, duration, coords, type);
    this.elevation = elevation;

    this.calSpeed();
  }

  calSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

/*
class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workOut = [];

  constructor() {
    this._getPosition();
    this._getLocalStorage();
    form.addEventListener('submit', this._newWorkOut.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._LoadMap.bind(this),
        function () {
          alert(`Could not get your current position`);
        }
      );
  }

  _LoadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    //console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#workOut.forEach(work => {
      this._renderWorkoutMarker(work);
    });

    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // prettier-ignore
    inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = ' ';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkOut(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);
    e.preventDefault();

    // Get data from user
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    //console.log(type);
    // If workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Check if datais valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Input have to be positive numbers!');
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout c ycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // Check if datais valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Input have to be positive numbers!');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    // Add new object to workout array
    this.#workOut.push(workout);
    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Hide form + clear input fields
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 50,
          autoClose: false,
          className: `${workout.type}-popup`,
          closeOnClick: false,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? ' 🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  // _date(workout) {
  //   const x = `${
  //     workout.type[0].toUpperCase() + workout.type.slice(1)
  //   } on ${new Intl.DateTimeFormat(navigator.language, {
  //     month: 'long',
  //     day: 'numeric',
  //   }).format(workout.date)}`;
  //   //format(this.date)}`; // Still not understand 'this.date'
  //   console.log(this);
  //   return x;
  // }
  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }"><button class="btn__edit">Edit</button><button class="btn__delete">Delete</button><h2 class="workout__title">${
      workout.description
    } </h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

    if (workout.type === 'running')
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
           <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
            </div></li>`;

    if (workout.type === 'cycling')
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elelevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li> `;

    form.insertAdjacentHTML('afterend', html);

    const btnDelete = document.querySelector('.btn__delete');

    btnDelete.addEventListener('click', this._deleteWorkOut.bind(this));
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    const btnDelete = e.target.closest('.btn__delete');
    if (!workoutEl) return;
    if (btnDelete) return;

    const workout = this.#workOut.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // using the public interface
    workout.click();
  }

  // _editWorkout(e) {
  //   const workoutEl2 = e.target.closest('.workout');

  //   if (!workoutEl2) return;
  //   const workout2 = this.#workOut.find(
  //     work => work.id === workoutEl2.dataset.id
  //   );
  //   console.log(workout2);
  //   form.classList.remove('hidden');
  // }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workOut));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;
    data.forEach(mov => {
      if (mov.type === 'running')
        this.#workOut.push(
          new Running(mov.coords, mov.distance, mov.duration, mov.cadence)
        );

      if (mov.type === 'cycling')
        this.#workOut.push(
          new Cycling(
            mov.coords,
            mov.distance,
            mov.duration,
            mov.elelevationGain
          )
        );
    });

    this.#workOut.forEach(work => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }

  _deleteWorkOut(e) {
    e.preventDefault();
    const workoutEl = e.target.closest('.workout');
    console.log(this.#workOut);
    this.#workOut = this.#workOut.filter(
      work => work.id !== workoutEl.dataset.id
    );
    console.log(this.#workOut);
    this.reset();
    this._setLocalStorage();
    this._getLocalStorage();
  }
}

const app = new App();
*/

// Ability to edit a workout
// Ability to delete a workout
// Ability to delete all workouts
// Ability to sort workouts by a certain field (e.g. distance)
// Re-build Running and Cycling objects coming from local storage
// More realistic error and confirmation messages;
// Ability to position the map to show all workouts [very hard];
// Ability to draw lines and shapes instead of just points [very hard];
// Geocode location from coordinates ("Run in Faro, Portugal") [only after asynchronous javaScript section];
// Display weather data for workout time and place [only after asynchronous javaScript section];
