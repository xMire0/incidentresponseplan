using System;
using Domain.Enum;

namespace Domain.Entities;

public class Scenario
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string Title { get; set; }    
    public required string Description { get;  set; }
    public required DateTime CreatedAt { get; set; }  
    //public required Risk Risk { get;  set; } //low medium el. high

}