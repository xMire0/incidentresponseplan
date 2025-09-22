using System;
using Domain.Enum;

namespace Domain.Entities;

public class Scenario
{
    public required Guid Id { get;  set; }   
    public required string Title { get;  set; }    
    public required string Description { get;  set; }
    public required  DateTime CreatedAt { get;  set; }      
    public required Risk Risk { get;  set; } //low medium el. high

}