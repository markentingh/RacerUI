using System;
using System.Collections.Generic;

namespace RacerUI.Entities
{
    public class Car
    {
        public int Id { get; set; }
        public int? ParentId { get; set; }
        public int GameId { get; set; }
        public int? Year { get; set; }
        public int? MakeId { get; set; }
        public int? ModelId { get; set; }
        public string Name { get; set; }
        public string Path { get; set; }
        public int? TeamId { get; set; }
        public string ShortDescription { get; set; }
        public string Author { get; set; }
        public string Class { get; set; }
        public decimal? MinBHP { get; set; }
        public decimal? MaxBHP { get; set; }
        public decimal? MinTorque { get; set; }
        public decimal? MaxTorque { get; set; }
        public decimal? Weight { get; set; }
        public decimal? MaxSpeed { get; set; }
        public decimal? ZeroTo100kmph { get; set; }
        public decimal? ZeroTo60mph { get; set; }
        public decimal? PWRatioKgPerHp { get; set; }
        public int Status { get; set; }
        public int? Rating { get; set; }
        public string PowerGraph { get; set; }
        public string TorqueGraph { get; set; }
        public string Notes { get; set; }
        public string Biography { get; set; }
        public string Drivers { get; set; }

        // Navigation properties
        public CarMake Make { get; set; }
        public CarModel Model { get; set; }
        public Game Game { get; set; }
        public Team Team { get; set; }
        public Car Parent { get; set; }
        public List<Car> ChildCars { get; set; } = new List<Car>();
        public List<CarSkin> Skins { get; set; } = new List<CarSkin>();
        public List<CarSpecialization> Specializations { get; set; } = new List<CarSpecialization>();
        public List<CarStyling> Stylings { get; set; } = new List<CarStyling>();
        public List<CarTag> Tags { get; set; } = new List<CarTag>();
        public List<CarType> Types { get; set; } = new List<CarType>();
    }
}
